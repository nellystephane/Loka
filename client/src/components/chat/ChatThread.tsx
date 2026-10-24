import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, CheckCheck, ChevronDown, Paperclip, Send, ShoppingBag, Truck } from 'lucide-react';
import { Avatar, Button, IconButton } from '../primitives';
import { ProposalCard, ProposalComposer, type ProposalData, type ProposalStatus } from './ProposalPanel';

type MessageStatus = 'sending' | 'sent' | 'received';
type MessageKind = 'text' | 'order' | 'delivery';

type ChatMessage = {
  id: string;
  from: 'me' | 'them';
  text?: string;
  kind?: MessageKind;
  proposal?: ProposalData;
  proposalStatus?: ProposalStatus;
  status: MessageStatus;
  time: string;
};

const initialMessages: ChatMessage[] = [
  { id: '1', from: 'them', text: 'Bonjour, le canapé est toujours disponible ?', status: 'received', time: '10:42' },
  { id: '2', from: 'me', text: 'Bonjour. Oui, il est disponible. Vous êtes dans quelle zone ?', status: 'sent', time: '10:43' },
  { id: '3', from: 'them', text: 'Je suis à Akpakpa. Est-ce que vous pouvez organiser la livraison ?', status: 'received', time: '10:44' },
  {
    id: '4', from: 'them', kind: 'delivery',
    proposal: { kind: 'delivery', orderRef: 'PC-2026-00482', pickup: 'Maison Naya · Haie Vive', destination: 'Akpakpa · Cotonou', fee: 2000, payer: 'client', paymentTiming: 'now' },
    proposalStatus: 'pending', status: 'received', time: '10:45'
  },
];

export function ChatThread() {
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [composerKind, setComposerKind] = useState<'order' | 'delivery' | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const lastMessageId = useMemo(() => messages[messages.length - 1]?.id, [messages]);

  useEffect(() => {
    const node = listRef.current;
    if (!node) return;
    node.scrollTo({ top: node.scrollHeight, behavior: 'smooth' });
  }, [lastMessageId]);

  const send = () => {
    const text = draft.trim();
    if (!text || sending) return;
    const id = `m-${Date.now()}`;
    setSending(true);
    setDraft('');
    setMessages(current => [...current, { id, from: 'me', text, status: 'sending', time: 'maintenant' }]);
    window.setTimeout(() => {
      setMessages(current => current.map(message => message.id === id ? { ...message, status: 'sent' } : message));
      setSending(false);
    }, 420);
  };

  const sendProposal = (data: ProposalData) => {
    const id = `proposal-${Date.now()}`;
    setMessages(current => [...current, {
      id, from: 'me', kind: data.kind, proposal: data, proposalStatus: 'pending',
      text: data.kind === 'order' ? 'Proposition de commande' : 'Proposition de livraison',
      status: 'sending', time: 'maintenant',
    }]);
    window.setTimeout(() => {
      setMessages(current => current.map(message => message.id === id ? { ...message, status: 'sent' } : message));
    }, 420);
  };

  const updateProposal = (id: string, nextStatus: ProposalStatus) => {
    setMessages(current => current.map(message => message.id === id ? { ...message, proposalStatus: nextStatus } : message));
  };

  return <>
    <section className="chat-thread" aria-label="Conversation">
      <header className="chat-context-bar">
        <div className="chat-person">
          <Avatar size="md" name="Maison Naya" />
          <div><strong>Maison Naya</strong><span><i className="chat-online-dot" /> En ligne</span></div>
        </div>
        <IconButton label="Options de la conversation"><ChevronDown size={18} /></IconButton>
      </header>

      <div className="chat-object-context">
        <div className="chat-object-icon"><ShoppingBag size={17} /></div>
        <div><span>À propos de</span><strong>Canapé 3 places — 145 000 FCFA</strong></div>
        <Button variant="ghost" className="button-sm">Voir</Button>
      </div>

      <div className="chat-messages" ref={listRef}>
        <div className="chat-date-separator"><span>Aujourd'hui</span></div>
        {messages.map(message => <MessageBubble key={message.id} message={message} onProposalAction={updateProposal} />)}
      </div>

      <div className="chat-composer-wrap">
        <div className="chat-proposal-actions">
          <button type="button" className="chat-proposal-button" onClick={() => setComposerKind('order')}><ShoppingBag size={15} /> Commande</button>
          <button type="button" className="chat-proposal-button" onClick={() => setComposerKind('delivery')}><Truck size={15} /> Livraison</button>
        </div>
        <div className="chat-composer">
          <IconButton label="Ajouter une pièce jointe"><Paperclip size={18} /></IconButton>
          <input value={draft} onChange={event => setDraft(event.target.value)} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); send(); } }} placeholder="Écrire un message…" aria-label="Message" />
          <button className="chat-send-button" type="button" onClick={send} disabled={!draft.trim() || sending} aria-label="Envoyer"><Send size={17} /></button>
        </div>
      </div>
    </section>

    <ProposalComposer
      kind={composerKind ?? 'order'}
      open={composerKind !== null}
      onClose={() => setComposerKind(null)}
      onSubmit={sendProposal}
    />
  </>;
}

function MessageBubble({ message, onProposalAction }: { message: ChatMessage; onProposalAction: (id: string, status: ProposalStatus) => void }) {
  const own = message.from === 'me';
  const proposal = message.proposal;
  return <article className={`chat-message ${own ? 'chat-message-own' : 'chat-message-other'} ${message.status === 'sending' ? 'is-sending' : ''}`}>
    <div className="chat-bubble">
      {proposal ? <ProposalCard
        data={proposal}
        from={message.from}
        status={message.proposalStatus ?? 'pending'}
        onAccept={!own ? () => onProposalAction(message.id, 'payment_pending') : undefined}
        onRefuse={!own ? () => onProposalAction(message.id, 'refused') : undefined}
        onPay={!own ? () => onProposalAction(message.id, 'paid') : undefined}
      /> : message.kind ? <div className="chat-proposal-card"><div className="chat-proposal-card-icon">{message.kind === 'order' ? <ShoppingBag size={17} /> : <Truck size={17} />}</div><div><strong>{message.text}</strong><span>{message.kind === 'order' ? 'Produits, quantité et montant' : 'Frais, zone et modalités'}</span></div></div> : <p>{message.text}</p>}
      <footer><span>{message.time}</span>{own && <MessageStatus status={message.status} />}</footer>
    </div>
  </article>;
}

function MessageStatus({ status }: { status: MessageStatus }) {
  if (status === 'sending') return <span className="message-status sending-status" aria-label="Envoi en cours"><span /><span /><span /></span>;
  if (status === 'sent') return <Check size={13} aria-label="Envoyé" />;
  return <CheckCheck size={14} aria-label="Reçu" />;
}
