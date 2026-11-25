import {
  Grafica502,
  GraficaFemicidiosPorAnio,
  GraficaOchoHechos,
  GraficaTresCasos,
} from "./DenunciasMP";

/**
 * Data charts placed by hand in a note's MDX: `<Grafica id="…" />`.
 * The id is a string because next-mdx-remote v6 blocks JS expressions, so
 * each chart carries its own data. To add one, write the component (D3 in a
 * client component) and register it here.
 */
const GRAFICAS: Record<string, () => React.ReactElement> = {
  "denuncias-mp-502": Grafica502,
  "denuncias-mp-tres-casos": GraficaTresCasos,
  "denuncias-mp-ocho-hechos": GraficaOchoHechos,
  "denuncias-mp-femicidios-por-anio": GraficaFemicidiosPorAnio,
};

export function Grafica({ id }: { id: string }) {
  const Componente = GRAFICAS[id];
  if (!Componente) {
    // Fail loud in the build log rather than leave a silent hole in the note.
    console.warn(`<Grafica id="${id}" />: no hay ninguna gráfica registrada con ese id`);
    return null;
  }
  return <Componente />;
}
