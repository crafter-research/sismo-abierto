import { ApiReference } from "../../components/api-reference";

export const metadata = { title: "API" };

export default function ApiDocsPage() {
  return (
    <div className="-mx-4 -my-5 flex-1" data-testid="api-reference">
      <ApiReference />
    </div>
  );
}
