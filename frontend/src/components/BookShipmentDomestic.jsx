import BookShipmentDomesticStep1 from "./BookShipmentDomesticStep1";
import BookShipmentDomesticStep2 from "./BookShipmentDomesticStep2";
import BookShipmentDomesticStep3 from "./BookShipmentDomesticStep3";

export default function BookShipmentDomestic({
  step,
  data,
  onChange,
  onNext,
  onBack,
}) {
  if (step === 1) {
    return (
      <BookShipmentDomesticStep1
        data={data}
        onChange={onChange}
        onNext={onNext}
      />
    );
  }

  if (step === 2) {
    return (
      <BookShipmentDomesticStep2
        data={data}
        onChange={onChange}
        onNext={onNext}
        onBack={onBack}
      />
    );
  }

  if (step === 3) {
    return (
      <BookShipmentDomesticStep3
        data={data}
        onChange={onChange}
        onNext={onNext}
        onBack={onBack}
      />
    );
  }
  return <div>Step {step} coming soon...</div>;
}
