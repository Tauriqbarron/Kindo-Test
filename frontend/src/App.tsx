import Header from './components/Header';
import Footer from './components/Footer';
import PaymentWizard from './components/wizard/PaymentWizard';

function App() {
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
        <PaymentWizard />
      </main>
      <Footer />
    </>
  );
}

export default App;
