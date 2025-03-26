
import { Auth } from "./Auth";

export const WelcomePage = () => {
  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <h2 className="text-2xl font-bold text-center mb-8">
        Bienvenido a PRLconecta
      </h2>
      <p className="text-gray-600 text-center mb-8">
        Su plataforma para la gestión de prevención de riesgos laborales
      </p>
      <Auth />
    </div>
  );
};
