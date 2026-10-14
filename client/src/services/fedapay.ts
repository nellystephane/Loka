export type FedaPayCustomer = {
  firstname?: string;
  lastname?: string;
  email?: string;
  phone?: string;
};

type FedaPayWidget = {
  open: () => void;
};

type FedaPayApi = {
  init: (options: {
    public_key: string;
    transaction: { amount: number; description: string };
    customer?: FedaPayCustomer;
  }) => FedaPayWidget;
};

declare global {
  interface Window {
    FedaPay?: FedaPayApi;
  }
}

let scriptPromise: Promise<void> | null = null;

function loadScript() {
  if (window.FedaPay) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-loka-fedapay]');
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Impossible de charger le module de paiement.')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.fedapay.com/checkout.js?v=1.1.7';
    script.async = true;
    script.dataset.lokaFedapay = 'true';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Impossible de charger le module de paiement.'));
    document.head.appendChild(script);
  });

  return scriptPromise;
}

export async function openSecureCheckout({
  amount,
  description,
  customer,
}: {
  amount: number;
  description: string;
  customer?: FedaPayCustomer;
}) {
  const publicKey = import.meta.env.VITE_FEDAPAY_PUBLIC_KEY as string | undefined;
  if (!publicKey) throw new Error('Le module de paiement n’est pas encore configuré.');

  await loadScript();
  if (!window.FedaPay) throw new Error('Le module de paiement est indisponible.');

  const widget = window.FedaPay.init({
    public_key: publicKey,
    transaction: { amount, description },
    customer,
  });

  widget.open();
}
