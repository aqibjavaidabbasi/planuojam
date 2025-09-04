import HomePage from "./HomePage";


export default async function Root({ params }: { params: Promise<{ locale: string }> }) {
  const paramsData = await params;
  return <HomePage params={paramsData} />
}