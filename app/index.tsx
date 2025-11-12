import AuthComponent from "@/components/AuthComponent";

export default function Index() {
  // On affiche AuthComponent si pas connecté
  // Sinon, redirige vers Drawer
  return <AuthComponent />;
}