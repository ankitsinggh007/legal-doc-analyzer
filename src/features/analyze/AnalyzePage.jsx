import { Container } from "../../components/layout/Container";
import UploadHeader from "./components/UploadHeader";
import DropzonePlaceholder from "./components/DropzonePlaceholder";
import FooterHint from "./components/FooterHint";

export function AnalyzePage() {
  return (
    <main className="min-h-[80vh] flex flex-col justify-center">
      <Container>
        <div className="flex flex-col items-center gap-8 text-center">
          <UploadHeader />
          <DropzonePlaceholder />
          <FooterHint />
        </div>
      </Container>
    </main>
  );
}
