const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { verifierIdTokenGoogle } = require('../utils/googleAuth');
const { envoyerEmail, gabaritEmail } = require('../utils/email');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Annonce = require('../models/Annonce');
const Avis = require('../models/Avis');
const { JWT_SECRET } = require('../config/jwt');

// ─── Générer le token JWT ───
const genererJetonAleatoire = () => crypto.randomBytes(32).toString('hex');
const hacherJeton = (jeton) => crypto.createHash('sha256').update(jeton).digest('hex');

const generateToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, {
    expiresIn: '30d'
  });
};

// ─── Inscription ───
// POST /api/users/register
const register = async (req, res) => {
  try {
    const { nom, prenom, email, motDePasse, telephone, ville } = req.body;

    // Vérifier champs obligatoires
    if (!nom || !prenom || !email || !motDePasse || !ville) {
      return res.status(400).json({
        message: 'Tous les champs obligatoires doivent être remplis : nom, prénom, email, mot de passe, ville.'
      });
    }

    // Vérifier si l'email existe déjà
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé.' });
    }

    if (String(motDePasse).length < 8) return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 8 caractères.' });
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(motDePasse, salt);
    const verificationToken = genererJetonAleatoire();

    // Créer l'utilisateur
    const user = await User.create({
      nom,
      prenom,
      email,
      motDePasse: hashedPassword,
      fournisseurAuth: 'email',
      emailVerifie: false,
      emailVerificationTokenHash: hacherJeton(verificationToken),
      emailVerificationExpireLe: new Date(Date.now() + 24 * 60 * 60 * 1000),
      telephone: telephone || '',
      localisation: {
        ville: ville.trim()
      }
    });

    const lienVerification = `${process.env.FRONTEND_URL || ''}/verification-email?token=${verificationToken}`;
    await envoyerEmail({ to: user.email, sujet: 'Confirmez votre adresse email — Loka', html: gabaritEmail('Confirmez votre adresse email', '<p>Votre compte Loka est créé. Confirmez votre adresse email pour terminer l’inscription.</p>', lienVerification) });

    res.status(201).json({
      _id: user._id,
      nom: user.nom,
      prenom: user.prenom,
      email: user.email,
      telephone: user.telephone,
      localisation: user.localisation,
      role: user.role,
      statut: user.statut,
      emailVerifie: user.emailVerifie,
      token: generateToken(user._id)
    });

  } catch (error) {
    // Gestion des erreurs de validation Mongoose (ex: email unique)
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé.' });
    }
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ─── Connexion ───
// POST /api/users/login
const login = async (req, res) => {
  try {
    const { email, motDePasse } = req.body;

    if (!email || !motDePasse) {
      return res.status(400).json({ message: 'Email et mot de passe sont obligatoires.' });
    }

    // Trouver l'utilisateur
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect.' });
    }

    if (!user.motDePasse) return res.status(401).json({ message: 'Ce compte utilise la connexion Google.' });
    const isMatch = await bcrypt.compare(motDePasse, user.motDePasse);
    if (!isMatch) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect.' });
    }
    if (!user.emailVerifie) return res.status(403).json({ message: 'Veuillez confirmer votre adresse email avant de vous connecter.', emailVerifie: false });

    res.json({
      _id: user._id,
      nom: user.nom,
      prenom: user.prenom,
      email: user.email,
      telephone: user.telephone,
      photo: user.photo,
      localisation: user.localisation,
      estVerifie: user.estVerifie,
      emailVerifie: user.emailVerifie,
      role: user.role,
      statut: user.statut,
      token: generateToken(user._id)
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};



// POST /api/users/google
const loginGoogle = async (req, res) => {
  try {
    const payload = await verifierIdTokenGoogle(req.body?.idToken);
    const email = String(payload.email).toLowerCase().trim();
    let user = await User.findOne({ $or: [{ googleId: payload.sub }, { email }] });
    if (!user) {
      user = await User.create({ nom: payload.family_name || 'Utilisateur', prenom: payload.given_name || 'Google', email, motDePasse: null, fournisseurAuth: 'google', googleId: payload.sub, emailVerifie: true, photo: payload.picture || '' });
    } else {
      if (user.googleId && user.googleId !== payload.sub) return res.status(409).json({ message: 'Ce compte Google est déjà associé à un autre compte.' });
      user.googleId = payload.sub; user.fournisseurAuth = 'google'; user.emailVerifie = true; if (!user.photo && payload.picture) user.photo = payload.picture; await user.save();
    }
    return res.json({ _id:user._id, nom:user.nom, prenom:user.prenom, email:user.email, telephone:user.telephone, photo:user.photo, localisation:user.localisation, estVerifie:user.estVerifie, emailVerifie:true, role:user.role, statut:user.statut, token:generateToken(user._id) });
  } catch (e) { console.error('Google auth:', e.message); return res.status(401).json({ message: 'Connexion Google invalide ou expirée.' }); }
};

const verifierEmail = async (req, res) => {
  try {
    const token = String(req.query.token || ''); if (!token) return res.status(400).json({ message: 'Jeton de confirmation manquant.' });
    const user = await User.findOne({ emailVerificationTokenHash:hacherJeton(token), emailVerificationExpireLe:{ $gt:new Date() } }).select('+emailVerificationTokenHash +emailVerificationExpireLe');
    if (!user) return res.status(400).json({ message:'Lien de confirmation invalide ou expiré.' });
    user.emailVerifie=true; user.emailVerificationTokenHash=null; user.emailVerificationExpireLe=null; await user.save();
    return res.json({ message:'Adresse email confirmée.', token:generateToken(user._id) });
  } catch(e){ return res.status(500).json({message:'Erreur serveur.'}); }
};

const renvoyerVerification = async (req,res) => {
  try {
    const {email}=req.body||{}; const user=await User.findOne({email:String(email||'').toLowerCase().trim()}).select('+emailVerificationTokenHash +emailVerificationExpireLe');
    if(!user || user.emailVerifie) return res.json({message:'Si un compte non confirmé correspond à cet email, un nouveau lien a été envoyé.'});
    const token=genererJetonAleatoire(); user.emailVerificationTokenHash=hacherJeton(token); user.emailVerificationExpireLe=new Date(Date.now()+24*60*60*1000); await user.save();
    const lien=`${process.env.FRONTEND_URL||''}/verification-email?token=${token}`; await envoyerEmail({to:user.email,sujet:'Nouveau lien de confirmation — Loka',html:gabaritEmail('Confirmez votre adresse email','<p>Voici votre nouveau lien de confirmation.</p>',lien)});
    res.json({message:'Si un compte non confirmé correspond à cet email, un nouveau lien a été envoyé.'});
  }catch(e){res.status(500).json({message:'Erreur serveur.'});}
};

const demanderResetMotDePasse = async (req,res) => {
  try { const user=await User.findOne({email:String(req.body?.email||'').toLowerCase().trim()}).select('+passwordResetTokenHash +passwordResetExpireLe'); if(user?.motDePasse){const token=genererJetonAleatoire(); user.passwordResetTokenHash=hacherJeton(token); user.passwordResetExpireLe=new Date(Date.now()+30*60*1000); await user.save(); const lien=`${process.env.FRONTEND_URL||''}/reset-password?token=${token}`; await envoyerEmail({to:user.email,sujet:'Réinitialiser votre mot de passe — Loka',html:gabaritEmail('Réinitialisation du mot de passe','<p>Ce lien est valable 30 minutes.</p>',lien)});} return res.json({message:'Si un compte correspond à cet email, un lien de réinitialisation a été envoyé.'}); } catch(e){res.status(500).json({message:'Erreur serveur.'});}
};

const resetMotDePasse = async (req,res) => {
  try { const {token,nouveauMotDePasse,confirmation}=req.body||{}; if(!token||!nouveauMotDePasse||nouveauMotDePasse.length<8||nouveauMotDePasse!==confirmation)return res.status(400).json({message:'Jeton ou mot de passe invalide.'}); const user=await User.findOne({passwordResetTokenHash:hacherJeton(token),passwordResetExpireLe:{$gt:new Date()}}).select('+passwordResetTokenHash +passwordResetExpireLe'); if(!user)return res.status(400).json({message:'Lien invalide ou expiré.'}); user.motDePasse=await bcrypt.hash(nouveauMotDePasse,10); user.fournisseurAuth='email'; user.passwordResetTokenHash=null; user.passwordResetExpireLe=null; await user.save(); res.json({message:'Mot de passe réinitialisé.'}); } catch(e){res.status(500).json({message:'Erreur serveur.'});}
};

// ─── Profil utilisateur connecté ───
// GET /api/users/profil
const getProfil = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-motDePasse');
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    }
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ─── Modifier profil ───
// PUT /api/users/profil
const updateProfil = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    }

    const { nom, prenom, telephone, photo, localisation } = req.body;

    if (nom) user.nom = nom;
    if (prenom) user.prenom = prenom;
    if (telephone) user.telephone = telephone;
    if (photo) user.photo = photo;
    if (localisation) {
      // Mise à jour partielle ou complète de la localisation
      user.localisation = {
        ...user.localisation,
        ...localisation
      };
    }

    // Si mot de passe fourni, le hasher
    if (req.body.motDePasse) {
      const salt = await bcrypt.genSalt(10);
      user.motDePasse = await bcrypt.hash(req.body.motDePasse, salt);
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      nom: updatedUser.nom,
      prenom: updatedUser.prenom,
      email: updatedUser.email,
      telephone: updatedUser.telephone,
      photo: updatedUser.photo,
      localisation: updatedUser.localisation
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};


// ─── Changer le mot de passe ───
// PUT /api/users/password
const changePassword = async (req, res) => {
  try {
    const { ancienMotDePasse, nouveauMotDePasse, confirmation } = req.body;

    // Validation simple
    if (!ancienMotDePasse || !nouveauMotDePasse || !confirmation) {
      return res.status(400).json({ message: 'Tous les champs sont obligatoires.' });
    }
    if (nouveauMotDePasse.length < 6) {
      return res.status(400).json({ message: 'Le nouveau mot de passe doit contenir au moins 6 caractères.' });
    }
    if (nouveauMotDePasse !== confirmation) {
      return res.status(400).json({ message: 'Le nouveau mot de passe et la confirmation ne correspondent pas.' });
    }

    // Récupérer l'utilisateur (déjà injecté par le middleware auth)
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    }

    // Vérifier l'ancien mot de passe
    const isMatch = await bcrypt.compare(ancienMotDePasse, user.motDePasse);
    if (!isMatch) {
      return res.status(401).json({ message: 'Ancien mot de passe incorrect.' });
    }

    // Hasher le nouveau mot de passe
    const salt = await bcrypt.genSalt(10);
    user.motDePasse = await bcrypt.hash(nouveauMotDePasse, salt);
    await user.save();

    res.json({ message: 'Mot de passe modifié avec succès.' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ─── Supprimer le compte ───
// DELETE /api/users
const deleteAccount = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    }

    // Supprimer également toutes ses annonces (optionnel mais recommandé)
    await Annonce.deleteMany({ createur: req.user._id });
    // Supprimer ses avis (s'il y en a)
    await Avis.deleteMany({ auteur: req.user._id });
    
    await User.findByIdAndDelete(req.user._id);

    res.json({ message: 'Compte supprimé avec succès.' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ─── Ajouter/retirer une annonce des favoris ───
// PUT /api/users/favoris/:annonceId
const toggleFavori = async (req, res) => {
  try {
    const { annonceId } = req.params;
    const Annonce = require('../models/Annonce');

    const annonceExiste = await Annonce.exists({ _id: annonceId });
    if (!annonceExiste) {
      return res.status(404).json({ message: 'Annonce non trouvée.' });
    }

    const user = await User.findById(req.user._id);
    const dejaFavori = user.favoris.some(id => id.toString() === annonceId);

    if (dejaFavori) {
      user.favoris = user.favoris.filter(id => id.toString() !== annonceId);
    } else {
      user.favoris.push(annonceId);
    }

    await user.save();
    res.json({ favoris: user.favoris, estFavori: !dejaFavori });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ─── Liste des annonces favorites de l'utilisateur connecté ───
// GET /api/users/favoris
const getFavoris = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'favoris',
      populate: { path: 'createur', select: 'nom prenom photo telephone' }
    });

    res.json(user.favoris);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

module.exports = {
  register, login, getProfil, updateProfil, deleteAccount, changePassword,
  toggleFavori, getFavoris, loginGoogle, verifierEmail, renvoyerVerification, demanderResetMotDePasse, resetMotDePasse
};
