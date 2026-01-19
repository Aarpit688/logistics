import BookShipmentDomesticStep1 from "./BookShipmentDomesticStep1";
import BookShipmentDomesticStep2 from "./BookShipmentDomesticStep2";

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

  return <div>Step {step} coming soon...</div>;
}
