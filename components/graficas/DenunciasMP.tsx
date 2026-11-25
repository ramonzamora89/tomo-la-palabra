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

/* ---------------------------------------------------------------------- */
/* 3. The eight femicides with the same accused: days since the complaint */
/* ---------------------------------------------------------------------- */

const HECHOS = [
  { lugar: "Asunción Mita, Jutiapa", femicidio: "2025-12-30", dias: 26 },
  { lugar: "El Chal, Petén", femicidio: "2025-09-25", dias: 34 },
  { lugar: "Puerto Barrios, Izabal", femicidio: "2024-12-06", dias: 64 },
  { lugar: "Lugar sin información", femicidio: "2020-12-12", dias: 74 },
  { lugar: "San Luis Jilotepeque, Jalapa", femicidio: "2025-12-30", dias: 76 },
  { lugar: "Antigua Guatemala, Sacatepéquez", femicidio: "2024-08-30", dias: 270 },
  { lugar: "Asunción Mita, Jutiapa", femicidio: "2023-08-22", dias: 665 },
  { lugar: "Amatitlán, Guatemala", femicidio: "2018-05-25", dias: 1006 },
];

const FUENTE_SINDICADO =
  "Fuente: Ministerio Público, tabla de femicidios con el mismo sindicado en la denuncia previa (17 de mayo de 2018 al 16 de mayo de 2026), entregada a Tomo la Palabra por solicitud de acceso a la información pública. En Amatitlán, la denuncia previa es de 2015.";

const miles = (n: number) => n.toLocaleString("es-GT");

export function GraficaOchoHechos() {
  const [cont, ancho] = useAncho<HTMLDivElement>();
  const svgRef = useRef<SVGSVGElement>(null);
  const [tip, setTip] = useState<{ texto: string; x: number; y: number } | null>(null);

  useEffect(() => {
    if (!svgRef.current || !ancho) return;
    // Labels above each bar on a phone, beside it from 600 px.
    const angosto = ancho < 600;
    const izq = angosto ? 0 : 240;
    const der = 84;
    const fila = angosto ? 50 : 36;
    const alto = HECHOS.length * fila + 26;
    const x = d3.scaleLinear().domain([0, 1050]).range([izq + 6, ancho - der]);

    const svg = d3.select(svgRef.current).attr("width", ancho).attr("height", alto);
    svg.selectAll("*").remove();

    const g = svg
      .selectAll("g.hecho")
      .data(HECHOS)
      .join("g")
      .attr("class", "hecho")
      .attr("transform", (_, i) => `translate(0,${i * fila})`);

    const cy = angosto ? 34 : 18;
    g.append("text")
      .attr("x", 0)
      .attr("y", angosto ? 14 : cy)
      .attr("dominant-baseline", "middle")
      .attr("font-size", 14)
      .attr("fill", INK_900)
      .text((d) => (angosto ? `${d.lugar} · ${fecha(d.femicidio)}` : d.lugar));
    g.append("line").attr("x1", x(0)).attr("x2", x(1050)).attr("y1", cy).attr("y2", cy).attr("stroke", INK_300);
    g.append("rect")
      .attr("x", x(0))
      .attr("y", cy - 5)
      .attr("width", (d) => Math.max(2, x(d.dias) - x(0)))
      .attr("height", 10)
      .attr("rx", 3)
      .attr("fill", VERDE);
    g.append("circle").attr("cx", x(0)).attr("cy", cy).attr("r", 5).attr("fill", "#fff").attr("stroke", INK_900).attr("stroke-width", 2);
    g.append("circle").attr("cx", (d) => x(d.dias)).attr("cy", cy).attr("r", 6).attr("fill", INK_900).attr("stroke", "#fff").attr("stroke-width", 2);
    g.append("text")
      .attr("x", (d) => x(d.dias) + 12)
      .attr("y", cy)
      .attr("dominant-baseline", "middle")
      .attr("font-size", 14)
      .attr("font-weight", 700)
      .attr("fill", INK_900)
      .text((d) => `${miles(d.dias)} días`);
    // Hit target: the whole row.
    g.append("rect")
      .attr("width", ancho)
      .attr("height", fila)
      .attr("fill", "transparent")
      .on("pointerenter pointermove", (ev: PointerEvent, d) => {
        const [px, py] = d3.pointer(ev, cont.current);
        setTip({
          texto: `${d.lugar}: femicidio el ${fecha(d.femicidio)}, ${miles(d.dias)} días después de la denuncia`,
          x: px,
          y: py,
        });
      })
      .on("pointerleave", () => setTip(null));

    const eje = svg
      .append("g")
      .attr("transform", `translate(0,${HECHOS.length * fila + 2})`)
      .call(
        d3
          .axisBottom(x)
          .tickValues(angosto ? [0, 500, 1000] : [0, 250, 500, 750, 1000])
          .tickSize(5)
          .tickFormat((d) => miles(+d)),
      );
    eje.select(".domain").attr("stroke", INK_500);
    eje.selectAll(".tick line").attr("stroke", INK_500);
    eje.selectAll(".tick text").attr("fill", INK_600).attr("font-size", 12).attr("font-family", "inherit");
  }, [ancho, cont]);

  return (
    <figure className="not-prose my-12">
      <figcaption>
        <p className="font-display text-2xl leading-tight text-brand-verde">
          Ocho femicidios después de una denuncia contra el mismo sindicado
        </p>
        <p className="mt-1 text-base text-ink-700">
          Días entre la denuncia por violencia contra la mujer y el femicidio, en los ocho hechos en los que el
          registro del MP señala a la misma persona en ambos expedientes. En cinco pasaron menos de tres meses.
        </p>
      </figcaption>

      <div ref={cont} className="relative mt-4">
        <svg ref={svgRef} aria-hidden="true" className="block" />
        <p aria-hidden="true" className="text-right text-xs text-ink-600">
          días desde la denuncia
        </p>
        {tip && <Tooltip {...tip} />}
      </div>

      <p className="mt-3 text-xs text-ink-600">{FUENTE_SINDICADO}</p>

      <table className="sr-only">
        <caption>Días entre la denuncia y el femicidio, por hecho</caption>
        <thead>
          <tr>
            <th scope="col">Lugar del femicidio</th>
            <th scope="col">Fecha del femicidio</th>
            <th scope="col">Días desde la denuncia</th>
          </tr>
        </thead>
        <tbody>
          {HECHOS.map((h) => (
            <tr key={h.lugar + h.femicidio}>
              <th scope="row">{h.lugar}</th>
              <td>{fecha(h.femicidio)}</td>
              <td>{miles(h.dias)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

/* ------------------------------------------------------------- */
/* 4. Femicides among the 502, by year of the crime (2026 = cut) */
/* ------------------------------------------------------------- */

const POR_ANIO: { anio: number; n: number; corte?: boolean }[] = [
  { anio: 2018, n: 1 },
  { anio: 2019, n: 3 },
  { anio: 2020, n: 9 },
  { anio: 2021, n: 6 },
  { anio: 2022, n: 11 },
  { anio: 2023, n: 28 },
  { anio: 2024, n: 23 },
  { anio: 2025, n: 31 },
  { anio: 2026, n: 15, corte: true },
];

export function GraficaFemicidiosPorAnio() {
  const [cont, ancho] = useAncho<HTMLDivElement>();
  const svgRef = useRef<SVGSVGElement>(null);
  const [tip, setTip] = useState<{ texto: string; x: number; y: number } | null>(null);

  useEffect(() => {
    if (!svgRef.current || !ancho) return;
    const alto = 260;
    const abajo = 28;
    const angosto = ancho < 480;
    const x = d3
      .scaleBand<number>()
      .domain(POR_ANIO.map((d) => d.anio))
      .range([0, ancho])
      .paddingInner(0.3)
      .paddingOuter(0.1);
    const y = d3.scaleLinear().domain([0, 35]).range([alto - abajo, 24]);
    const svg = d3.select(svgRef.current).attr("width", ancho).attr("height", alto);
    svg.selectAll("*").remove();

    // The 2026 column is a partial year: hatched instead of solid.
    const patron = svg
      .append("defs")
      .append("pattern")
      .attr("id", "corte-2026")
      .attr("width", 6)
      .attr("height", 6)
      .attr("patternUnits", "userSpaceOnUse")
      .attr("patternTransform", "rotate(45)");
    patron.append("rect").attr("width", 6).attr("height", 6).attr("fill", "#fff");
    patron.append("rect").attr("width", 3).attr("height", 6).attr("fill", VERDE);

    const col = svg.selectAll("g.anio").data(POR_ANIO).join("g").attr("class", "anio");
    // Rounded top, square base on the baseline.
    col
      .append("path")
      .attr("d", (d) => {
        const x0 = x(d.anio)!;
        const w = x.bandwidth();
        const y0 = y(d.n);
        const b = y(0);
        const r = Math.min(4, (b - y0) / 2, w / 2);
        return `M${x0},${b}V${y0 + r}Q${x0},${y0} ${x0 + r},${y0}H${x0 + w - r}Q${x0 + w},${y0} ${x0 + w},${y0 + r}V${b}Z`;
      })
      .attr("fill", (d) => (d.corte ? "url(#corte-2026)" : VERDE))
      .attr("stroke", (d) => (d.corte ? VERDE : "none"))
      .attr("stroke-width", 1.5);
    col
      .append("text")
      .attr("x", (d) => x(d.anio)! + x.bandwidth() / 2)
      .attr("y", (d) => y(d.n) - 7)
      .attr("text-anchor", "middle")
      .attr("font-size", 14)
      .attr("font-weight", 700)
      .attr("fill", INK_900)
      .text((d) => d.n);
    col
      .append("text")
      .attr("x", (d) => x(d.anio)! + x.bandwidth() / 2)
      .attr("y", alto - 8)
      .attr("text-anchor", "middle")
      .attr("font-size", angosto ? 12 : 13)
      .attr("fill", INK_600)
      .text((d) => `${angosto ? `’${String(d.anio).slice(2)}` : d.anio}${d.corte ? "*" : ""}`);
    svg.append("line").attr("x1", 0).attr("x2", ancho).attr("y1", y(0)).attr("y2", y(0)).attr("stroke", INK_500);
    col
      .append("rect")
      .attr("x", (d) => x(d.anio)! - (x.step() - x.bandwidth()) / 2)
      .attr("width", x.step())
      .attr("height", alto)
      .attr("fill", "transparent")
      .on("pointerenter pointermove", (ev: PointerEvent, d) => {
        const [px, py] = d3.pointer(ev, cont.current);
        setTip({
          texto: `${d.anio}: ${d.n} ${d.n === 1 ? "femicidio" : "femicidios"}${d.corte ? " (hasta el corte de la base)" : ""}`,
          x: px,
          y: py,
        });
      })
      .on("pointerleave", () => setTip(null));
  }, [ancho, cont]);

  return (
    <figure className="not-prose my-12">
      <figcaption>
        <p className="font-display text-2xl leading-tight text-brand-verde">Los 127 femicidios, por año</p>
        <p className="mt-1 text-base text-ink-700">
          Femicidios de mujeres que antes habían denunciado violencia, según el año del delito.
        </p>
      </figcaption>

      <div ref={cont} className="relative mt-4">
        <svg ref={svgRef} aria-hidden="true" className="block" />
        {tip && <Tooltip {...tip} />}
      </div>

      <p className="mt-3 text-sm text-ink-700">* 2026 corresponde al corte de la base.</p>
      <p className="mt-2 text-xs text-ink-600">{FUENTE}</p>

      <table className="sr-only">
        <caption>Femicidios de mujeres que habían denunciado violencia, por año del delito</caption>
        <thead>
          <tr>
            <th scope="col">Año</th>
            <th scope="col">Femicidios</th>
          </tr>
        </thead>
        <tbody>
          {POR_ANIO.map((d) => (
            <tr key={d.anio}>
              <th scope="row">{d.corte ? `${d.anio} (corte de la base)` : d.anio}</th>
              <td>{d.n}</td>
            </tr>
          ))}
          <tr>
            <th scope="row">Total</th>
            <td>127</td>
          </tr>
        </tbody>
      </table>
    </figure>
  );
}
