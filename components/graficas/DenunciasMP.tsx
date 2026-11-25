"use client";

/**
 * Charts for "Consuelo Porras y las 502 mujeres que denunciaron violencia
 * antes de morir" (data: MP reports obtained by public-information request,
 * Jan 2018 – May 2026). Drawn with D3 at the container's real width, so the
 * text stays legible on a phone. Every number is also in visible text or in
 * a screen-reader table: the SVGs are aria-hidden.
 */

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

const VERDE = "#104734";
const AMARILLO = "#F9C432";
const INK_500 = "#8F8B7E";
const INK_300 = "#D9D9D9";
const INK_600 = "#6B6759";
const INK_900 = "#1C1B17";

const FUENTE =
  "Fuente: Ministerio Público, reportes estadísticos entregados a Tomo la Palabra por solicitud de acceso a la información pública (enero 2018 – mayo 2026).";

/** Width of the element, kept current with a ResizeObserver. */
function useAncho<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [ancho, setAncho] = useState(0);
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([e]) => setAncho(Math.floor(e.contentRect.width)));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return [ref, ancho] as const;
}

function Tooltip({ texto, x, y }: { texto: string | null; x: number; y: number }) {
  if (!texto) return null;
  return (
    <div
      role="presentation"
      className="pointer-events-none absolute z-10 max-w-[16rem] -translate-x-1/2 -translate-y-full rounded-md bg-ink-900 px-3 py-2 text-sm leading-snug text-white shadow-lg"
      style={{ left: x, top: y - 10 }}
    >
      {texto}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 1. Las 502: one square per woman, by the crime that was registered */
/* ------------------------------------------------------------------ */

const DELITOS = [
  { clave: "femicidio", nombre: "Femicidio", n: 127, color: VERDE },
  { clave: "homicidio", nombre: "Homicidio", n: 257, color: AMARILLO },
  { clave: "asesinato", nombre: "Asesinato", n: 113, color: INK_500 },
  {
    clave: "otros",
    nombre: "Otros",
    detalle: "3 homicidios en estado de emoción violenta, 1 homicidio preterintencional y 1 parricidio",
    n: 5,
    color: INK_300,
  },
] as const;
const TOTAL = d3.sum(DELITOS, (d) => d.n); // 502

const pct = (n: number) => `${Math.round((n / TOTAL) * 100)} %`;

export function Grafica502() {
  const [cont, ancho] = useAncho<HTMLDivElement>();
  const svgRef = useRef<SVGSVGElement>(null);
  const [activo, setActivo] = useState<string | null>(null);
  const [tip, setTip] = useState<{ texto: string; x: number; y: number } | null>(null);

  useEffect(() => {
    if (!svgRef.current || !ancho) return;
    // ~12 px squares with a 2 px gap; whole columns only.
    const gap = 2;
    const cols = ancho >= 600 ? 50 : 25;
    const lado = (ancho - gap * (cols - 1)) / cols;
    const filas = Math.ceil(TOTAL / cols);
    const alto = filas * lado + (filas - 1) * gap;

    const celdas = DELITOS.flatMap((d) => d3.range(d.n).map(() => d));

    const svg = d3.select(svgRef.current).attr("width", ancho).attr("height", alto);
    svg
      .selectAll("rect")
      .data(celdas)
      .join("rect")
      .attr("x", (_, i) => (i % cols) * (lado + gap))
      .attr("y", (_, i) => Math.floor(i / cols) * (lado + gap))
      .attr("width", lado)
      .attr("height", lado)
      .attr("rx", Math.min(3, lado / 4))
      .attr("fill", (d) => d.color)
      .on("pointerenter pointermove", (ev: PointerEvent, d) => {
        const [x, y] = d3.pointer(ev, cont.current);
        setActivo(d.clave);
        setTip({ texto: `${d.nombre}: ${d.n} de ${TOTAL} mujeres (${pct(d.n)})`, x, y });
      })
      .on("pointerleave", () => {
        setActivo(null);
        setTip(null);
      });
  }, [ancho, cont]);

  // Highlight without redrawing.
  useEffect(() => {
    if (!svgRef.current) return;
    d3.select(svgRef.current)
      .selectAll<SVGRectElement, (typeof DELITOS)[number]>("rect")
      .attr("opacity", (d) => (activo && d.clave !== activo ? 0.2 : 1));
  }, [activo, ancho]);

  return (
    <figure className="not-prose my-12">
      <figcaption>
        <p className="font-display text-2xl leading-tight text-brand-verde">
          502 mujeres denunciaron violencia y después murieron de forma violenta
        </p>
        <p className="mt-1 text-base text-ink-700">
          Cada cuadro es una mujer, según el delito contra la vida que registró el MP.
        </p>
      </figcaption>

      <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink-900">
        {DELITOS.map((d) => (
          <li key={d.clave}>
            <button
              type="button"
              className="flex items-center gap-2 rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-verde"
              aria-pressed={activo === d.clave}
              onClick={() => setActivo(activo === d.clave ? null : d.clave)}
              onMouseEnter={() => setActivo(d.clave)}
              onMouseLeave={() => setActivo(null)}
            >
              <span
                aria-hidden="true"
                className="inline-block h-3.5 w-3.5 rounded-sm"
                style={{ background: d.color, boxShadow: d.color === INK_300 ? `inset 0 0 0 1px ${INK_500}` : undefined }}
              />
              <span>
                <strong>{d.nombre}</strong> {d.n}{" "}
                <span className="text-ink-600">({pct(d.n)})</span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      <div ref={cont} className="relative mt-4">
        <svg ref={svgRef} aria-hidden="true" className="block" />
        {tip && <Tooltip {...tip} />}
      </div>

      <p className="mt-3 text-sm text-ink-700">
        <strong>Otros:</strong> {DELITOS[3].detalle}.
      </p>
      <p className="mt-2 text-xs text-ink-600">{FUENTE}</p>

      <table className="sr-only">
        <caption>Mujeres que denunciaron violencia y después fueron víctimas de un delito contra la vida, por delito</caption>
        <thead>
          <tr>
            <th scope="col">Delito</th>
            <th scope="col">Mujeres</th>
            <th scope="col">Porcentaje</th>
          </tr>
        </thead>
        <tbody>
          {DELITOS.map((d) => (
            <tr key={d.clave}>
              <th scope="row">{"detalle" in d ? `${d.nombre} (${d.detalle})` : d.nombre}</th>
              <td>{d.n}</td>
              <td>{pct(d.n)}</td>
            </tr>
          ))}
          <tr>
            <th scope="row">Total</th>
            <td>{TOTAL}</td>
            <td>100 %</td>
          </tr>
        </tbody>
      </table>
    </figure>
  );
}

/* ---------------------------------------------------------------------- */
/* 2. Three cases: complaint → dismissal → femicide, same accused person  */
/* ---------------------------------------------------------------------- */

type Caso = {
  lugar: string;
  denuncia: string;
  desestimacion: string;
  femicidio: string;
  femicidioNota: string;
  proceso: string;
};

const CASOS: Caso[] = [
  {
    lugar: "Asunción Mita, Jutiapa",
    denuncia: "2021-10-26",
    desestimacion: "2022-02-28",
    femicidio: "2023-08-22",
    femicidioNota: "Femicidio",
    proceso: "En investigación",
  },
  {
    lugar: "Antigua Guatemala, Sacatepéquez",
    denuncia: "2023-12-04",
    desestimacion: "2023-12-21",
    femicidio: "2024-08-30",
    femicidioNota: "El expediente se actualizó como femicidio",
    proceso: "Condena",
  },
  {
    lugar: "San Luis Jilotepeque, Jalapa",
    denuncia: "2025-10-15",
    desestimacion: "2025-11-05",
    femicidio: "2025-12-30",
    femicidioNota: "Femicidio",
    proceso: "En investigación",
  },
];

const parse = d3.utcParse("%Y-%m-%d");
const dias = (a: string, b: string) => d3.utcDay.count(parse(a)!, parse(b)!);
const MESES = ["ene.", "feb.", "mar.", "abr.", "may.", "jun.", "jul.", "ago.", "sept.", "oct.", "nov.", "dic."];
const fecha = (iso: string) => {
  const d = parse(iso)!;
  return `${d.getUTCDate()} ${MESES[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
};

const DOMINIO = 700; // days; longest case is 665

function FilaCaso({ caso, ancho, onTip }: { caso: Caso; ancho: number; onTip: (t: { texto: string; ev: PointerEvent } | null) => void }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const d1 = dias(caso.denuncia, caso.desestimacion);
  const d2 = dias(caso.desestimacion, caso.femicidio);

  useEffect(() => {
    if (!svgRef.current || !ancho) return;
    const alto = 28;
    const margenDer = 74; // room for the "665 días" label
    const x = d3.scaleLinear().domain([0, DOMINIO]).range([6, ancho - margenDer]);
    const cy = 12;
    const svg = d3.select(svgRef.current).attr("width", ancho).attr("height", alto);
    svg.selectAll("*").remove();

    const tramos = [
      { desde: 0, hasta: d1, color: AMARILLO, texto: `Denuncia (${fecha(caso.denuncia)}) → desestimada (${fecha(caso.desestimacion)}): ${d1} días` },
      { desde: d1, hasta: d1 + d2, color: VERDE, texto: `Desestimada (${fecha(caso.desestimacion)}) → ${caso.femicidioNota.toLowerCase()} (${fecha(caso.femicidio)}): ${d2} días` },
    ];

    // Thin track for the full scale, so short cases read as short.
    svg.append("line").attr("x1", x(0)).attr("x2", x(DOMINIO)).attr("y1", cy).attr("y2", cy).attr("stroke", INK_300).attr("stroke-width", 1);

    svg
      .selectAll("rect.tramo")
      .data(tramos)
      .join("rect")
      .attr("class", "tramo")
      .attr("x", (t) => x(t.desde) + (t.desde > 0 ? 1 : 0)) // 2 px surface gap between segments
      .attr("y", cy - 5)
      .attr("width", (t) => Math.max(2, x(t.hasta) - x(t.desde) - (t.desde > 0 ? 1 : 1)))
      .attr("height", 10)
      .attr("rx", 3)
      .attr("fill", (t) => t.color)
      .on("pointerenter pointermove", (ev: PointerEvent, t) => onTip({ texto: t.texto, ev }))
      .on("pointerleave", () => onTip(null));

    // Hollow ring = complaint, filled dot = death.
    svg.append("circle").attr("cx", x(0)).attr("cy", cy).attr("r", 5).attr("fill", "#fff").attr("stroke", INK_900).attr("stroke-width", 2);
    svg.append("circle").attr("cx", x(d1 + d2)).attr("cy", cy).attr("r", 6).attr("fill", INK_900).attr("stroke", "#fff").attr("stroke-width", 2);

    svg
      .append("text")
      .attr("x", x(d1 + d2) + 12)
      .attr("y", cy)
      .attr("dominant-baseline", "middle")
      .attr("font-size", 14)
      .attr("font-weight", 700)
      .attr("fill", INK_900)
      .text(`${d1 + d2} días`);
  }, [ancho, caso, d1, d2, onTip]);

  return (
    <li className="py-4">
      <p className="font-semibold text-ink-900">
        {caso.lugar} <span className="font-normal text-ink-600">· {caso.proceso}</span>
      </p>
      <p className="mt-1 text-sm text-ink-700">
        Denunció el {fecha(caso.denuncia)}. El MP desestimó la denuncia {d1} días después. {d2} días más tarde,{" "}
        {caso.femicidioNota === "Femicidio"
          ? `el ${fecha(caso.femicidio)}, fue víctima de femicidio.`
          : `el ${fecha(caso.femicidio)}, su expediente se actualizó como femicidio.`}
      </p>
      <svg ref={svgRef} aria-hidden="true" className="mt-2 block" />
    </li>
  );
}

export function GraficaTresCasos() {
  const [cont, ancho] = useAncho<HTMLDivElement>();
  const ejeRef = useRef<SVGSVGElement>(null);
  const [tip, setTip] = useState<{ texto: string; x: number; y: number } | null>(null);

  const onTip = useRef((t: { texto: string; ev: PointerEvent } | null) => {
    if (!t) return setTip(null);
    const [x, y] = d3.pointer(t.ev, cont.current);
    setTip({ texto: t.texto, x, y });
  }).current;

  useEffect(() => {
    if (!ejeRef.current || !ancho) return;
    const x = d3.scaleLinear().domain([0, DOMINIO]).range([6, ancho - 74]);
    const svg = d3.select(ejeRef.current).attr("width", ancho).attr("height", 34);
    svg.selectAll("*").remove();
    const eje = svg
      .append("g")
      .attr("transform", "translate(0,1)")
      .call(
        d3
          .axisBottom(x)
          .tickValues(ancho < 480 ? [0, 200, 400, 600] : [0, 100, 200, 300, 400, 500, 600, 700])
          .tickSize(5)
          .tickFormat((d) => `${d}`),
      );
    eje.select(".domain").attr("stroke", INK_500);
    eje.selectAll(".tick line").attr("stroke", INK_500);
    eje.selectAll(".tick text").attr("fill", INK_600).attr("font-size", 12).attr("font-family", "inherit");
    svg
      .append("text")
      .attr("x", ancho - 74)
      .attr("y", 32)
      .attr("text-anchor", "end")
      .attr("font-size", 12)
      .attr("fill", INK_600)
      .text("días desde la denuncia");
  }, [ancho]);

  return (
    <figure className="not-prose my-12">
      <figcaption>
        <p className="font-display text-2xl leading-tight text-brand-verde">
          Denunciaron, el MP desestimó y después las mataron
        </p>
        <p className="mt-1 text-base text-ink-700">
          Tres casos en los que la fiscalía desestimó la denuncia cuando la mujer seguía con vida y luego
          identificó al mismo sindicado por su femicidio.
        </p>
      </figcaption>

      <ul aria-hidden="true" className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink-900">
        <li className="flex items-center gap-2">
          <span className="inline-block h-2.5 w-6 rounded-sm" style={{ background: AMARILLO }} />
          De la denuncia a la desestimación
        </li>
        <li className="flex items-center gap-2">
          <span className="inline-block h-2.5 w-6 rounded-sm" style={{ background: VERDE }} />
          De la desestimación al femicidio
        </li>
      </ul>

      <div ref={cont} className="relative">
        <ul className="divide-y divide-brand-gris">
          {CASOS.map((c) => (
            <FilaCaso key={c.lugar} caso={c} ancho={ancho} onTip={onTip} />
          ))}
        </ul>
        <svg ref={ejeRef} aria-hidden="true" className="block" />
        {tip && <Tooltip {...tip} />}
      </div>

      <p className="mt-3 text-xs text-ink-600">{FUENTE}</p>
    </figure>
  );
}
