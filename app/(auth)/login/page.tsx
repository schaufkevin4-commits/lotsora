import { LoginFormular } from "./LoginFormular";

export default async function LoginPage({ searchParams }: {
  searchParams: Promise<{ fehler?: string }>;
}) {
  const { fehler } = await searchParams;
  return <LoginFormular bestaetigungFehlgeschlagen={fehler === "bestaetigung"} />;
}
