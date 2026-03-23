import { useSearchParams } from 'react-router-dom';
import PaymentWizard from '../components/wizard/PaymentWizard';

export default function TripWizardPage() {
  const [searchParams] = useSearchParams();
  const payRegistrationId = searchParams.get('pay');

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
      <PaymentWizard initialPayRegistrationId={payRegistrationId} />
    </main>
  );
}
