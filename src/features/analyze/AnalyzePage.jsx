import { Container } from "../../components/layout/Container";
import UploadHeader from "./components/UploadHeader";
import DropzoneCard from "./components/DropzoneCard";
import FooterHint from "./components/FooterHint";
export function AnalyzePage() {
  const handleFileAccepted = (file) => {
    console.log("✅ File ready:", file.name);
  };
  return (
    <main className="min-h-[80vh] flex flex-col justify-center">
      <Container>
        <div className="flex flex-col items-center gap-8 text-center">
          <UploadHeader />
          <DropzoneCard onFileAccepted={handleFileAccepted} />
          <FooterHint />
        </div>
      </Container>
    </main>
  );
}
