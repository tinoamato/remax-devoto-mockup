import { useState } from "react";
import type { Asesor } from "../datos";
import { useApp } from "../tienda";
import {
  Boton,
  CabezaPanel,
  Campo,
  Etiqueta,
  Inicial,
  Modal,
  Panel,
  PistaScroll,
  Td,
  Th,
  Vacio,
} from "../../components/ui";
import { Icono } from "../../lib/icons";
import { cn } from "../../lib/format";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* ── Configuración de la oficina ────────────────────────────── */

function ConfiguracionOficina() {
  const { e, d } = useApp();
  const [email, setEmail] = useState(e.emailGerencia);
  const sucio = email.trim() !== e.emailGerencia;
  const valido = EMAIL_RE.test(email.trim());

  const guardar = () => {
    if (!valido) return;
    d({ t: "config.set", cambio: { emailGerencia: email.trim() } });
  };

  return (
    <Panel>
      <CabezaPanel titulo="Configuración de la oficina" />
      <div className="p-4">
        <div className="flex items-start gap-3">
          <span className="grid place-items-center size-9 rounded-[var(--r-sm)] bg-[var(--sello-tenue)] border border-[var(--sello-borde)] shrink-0">
            <Icono n="correo" s={16} className="text-[var(--sello)]" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold">Correo de gerencia</p>
            <p className="text-[11.5px] text-[var(--tinta-tenue)] mt-0.5 leading-relaxed">
              Recibe (o va en copia oculta) los correos que mandan las automatizaciones cuando el destinatario es
              «Gerencia».
            </p>

            <div className="flex items-end gap-2 mt-2.5">
              <Campo
                type="email"
                value={email}
                onChange={(ev) => setEmail(ev.target.value)}
                aria-label="Correo de gerencia"
                className="flex-1"
              />
              <Boton tono="primario" disabled={!sucio || !valido} onClick={guardar}>
                Guardar
              </Boton>
            </div>
            {sucio && !valido && (
              <p className="text-[11.5px] mt-1.5" style={{ color: "var(--lacre)" }}>
                Ese formato de correo no es válido.
              </p>
            )}
          </div>
        </div>

        <div className="mt-4 pt-3.5 border-t border-[var(--linea-suave)]">
          <p className="rotulo mb-2">Todavía no configurable acá</p>
          <div className="flex flex-wrap gap-1.5">
            <Etiqueta t="neutro">Firma de los correos</Etiqueta>
            <Etiqueta t="neutro">Permisos por usuario</Etiqueta>
            <Etiqueta t="neutro">Copia a más de un correo</Etiqueta>
          </div>
        </div>
      </div>
    </Panel>
  );
}

/* ── Resumen del equipo ─────────────────────────────────────── */

function Cifra({ rotulo, valor, color }: { rotulo: string; valor: number; color?: string }) {
  return (
    <div className="px-4 py-3.5">
      <p className="rotulo">{rotulo}</p>
      <p className="num font-semibold leading-none mt-1.5 text-[26px]" style={{ color: color ?? "var(--tinta)" }}>
        {valor}
      </p>
    </div>
  );
}

function ResumenEquipo({ activos, bajas }: { activos: number; bajas: number }) {
  return (
    <Panel>
      <CabezaPanel titulo="Resumen del equipo" />
      <div className="grid grid-cols-3 divide-x divide-[var(--linea-suave)]">
        <Cifra rotulo="Activos" valor={activos} color="var(--verde)" />
        <Cifra rotulo="De baja" valor={bajas} color={bajas ? "var(--tinta-media)" : undefined} />
        <Cifra rotulo="Total" valor={activos + bajas} />
      </div>
    </Panel>
  );
}

/* ── Alta / edición de agente ───────────────────────────────── */

function ModalAgente({
  agente,
  cerrar,
}: {
  agente: Asesor | null;
  cerrar: () => void;
}) {
  const { d } = useApp();
  const [nombre, setNombre] = useState(agente?.nombre ?? "");
  const [email, setEmail] = useState(agente?.email ?? "");
  const [tope, setTope] = useState(agente?.topeContactoDias ?? 30);

  const nombreValido = nombre.trim().length > 1;
  const emailValido = EMAIL_RE.test(email.trim());
  const puedeGuardar = nombreValido && emailValido && tope > 0;

  const guardar = () => {
    if (!puedeGuardar) return;
    if (agente) {
      d({
        t: "agente.editar",
        asesorId: agente.id,
        cambio: { nombre: nombre.trim(), email: email.trim(), topeContactoDias: tope },
      });
    } else {
      d({ t: "agente.crear", nombre: nombre.trim(), email: email.trim(), topeContactoDias: tope });
    }
    cerrar();
  };

  return (
    <Modal
      titulo={agente ? "Editar agente" : "Alta de agente"}
      sub={agente ? agente.nombre : "Se suma al equipo con facturación en cero"}
      cerrar={cerrar}
      pie={
        <>
          <Boton onClick={cerrar}>Cancelar</Boton>
          <Boton tono="primario" disabled={!puedeGuardar} onClick={guardar}>
            {agente ? "Guardar cambios" : "Dar de alta"}
          </Boton>
        </>
      }
    >
      <div className="space-y-3">
        <Campo rotulo="Nombre y apellido" value={nombre} onChange={(ev) => setNombre(ev.target.value)} />
        <Campo rotulo="Correo" type="email" value={email} onChange={(ev) => setEmail(ev.target.value)} />
        <Campo
          rotulo="Tope de días sin contacto"
          type="number"
          min={1}
          max={90}
          value={tope}
          onChange={(ev) => setTope(Number(ev.target.value) || 1)}
          className="w-[140px]"
        />
      </div>
    </Modal>
  );
}

/* ── Confirmar baja ─────────────────────────────────────────── */

function ModalBaja({ a, cerrar }: { a: Asesor; cerrar: () => void }) {
  const { d } = useApp();
  return (
    <Modal
      titulo="Dar de baja al agente"
      sub={a.nombre}
      cerrar={cerrar}
      ancho={420}
      pie={
        <>
          <Boton onClick={cerrar}>Cancelar</Boton>
          <Boton
            tono="peligro"
            ico="cruz"
            onClick={() => {
              d({ t: "agente.baja", asesorId: a.id });
              cerrar();
            }}
          >
            Dar de baja
          </Boton>
        </>
      }
    >
      <p className="text-[13px] text-[var(--tinta-media)] leading-relaxed">
        Deja de recibir correos automáticos y de contar en facturación proyectada y en cadencia de contacto. Se
        puede reactivar en cualquier momento y conserva todo su historial.
      </p>
    </Modal>
  );
}

/* ── Fila de agente ─────────────────────────────────────────── */

function FilaAgente({
  a,
  onEditar,
  onBaja,
}: {
  a: Asesor;
  onEditar: () => void;
  onBaja: () => void;
}) {
  const { d } = useApp();

  return (
    <tr className={cn(!a.activo && "opacity-60")}>
      <Td>
        <div className="flex items-center gap-2.5">
          <Inicial txt={a.iniciales} s={30} />
          <div className="min-w-0">
            <p className="font-medium truncate">{a.nombre}</p>
            <p className="text-[11.5px] text-[var(--tinta-tenue)] truncate">{a.email}</p>
          </div>
        </div>
      </Td>
      <Td>
        <label className="inline-flex items-center gap-1.5 text-[12.5px] text-[var(--tinta-media)]">
          <input
            type="number"
            min={1}
            disabled={!a.activo}
            value={a.topeContactoDias}
            onChange={(ev) => d({ t: "contacto.tope", asesorId: a.id, dias: Number(ev.target.value) || 1 })}
            aria-label={`Tope de días para ${a.nombre}`}
            className="num w-[52px] h-7 px-1.5 rounded-[var(--r-xs)] border border-[var(--linea-fuerte)] bg-[var(--papel-hundido)] text-[12.5px] font-semibold outline-none focus:bg-[var(--papel-alto)] focus:border-[var(--sello)] disabled:opacity-50"
          />
          días
        </label>
      </Td>
      <Td>{a.activo ? <Etiqueta t="ok">Activo</Etiqueta> : <Etiqueta t="neutro">De baja</Etiqueta>}</Td>
      <Td alDer>
        <div className="flex items-center justify-end gap-1.5">
          <Boton chico tono="secundario" ico="ajustes" onClick={onEditar}>
            Editar
          </Boton>
          {a.activo ? (
            <Boton chico tono="peligro" ico="cruz" onClick={onBaja}>
              Dar de baja
            </Boton>
          ) : (
            <Boton chico tono="primario" ico="tilde" onClick={() => d({ t: "agente.reactivar", asesorId: a.id })}>
              Reactivar
            </Boton>
          )}
        </div>
      </Td>
    </tr>
  );
}

/* ── Vista ──────────────────────────────────────────────────── */

export default function Equipo() {
  const { e } = useApp();
  const [alta, setAlta] = useState(false);
  const [editarId, setEditarId] = useState<string | null>(null);
  const [bajaId, setBajaId] = useState<string | null>(null);

  const activos = e.asesores.filter((a) => a.activo);
  const bajas = e.asesores.filter((a) => !a.activo);
  const ordenados = [...activos, ...bajas];
  const editando = editarId ? e.asesores.find((a) => a.id === editarId) ?? null : null;
  const dandoBaja = bajaId ? e.asesores.find((a) => a.id === bajaId) ?? null : null;

  return (
    <div className="h-full overflow-y-auto scroll p-4">
      <div className="max-w-[1400px] mx-auto space-y-4">
        <div className="grid gap-4 xl:grid-cols-[1fr_360px] items-start">
          <ConfiguracionOficina />
          <ResumenEquipo activos={activos.length} bajas={bajas.length} />
        </div>

        <Panel>
          <CabezaPanel
            titulo="Agentes"
            cuenta={activos.length}
            extra={
              <Boton chico tono="primario" ico="usuarioMas" onClick={() => setAlta(true)}>
                Agente
              </Boton>
            }
          />
          {e.asesores.length === 0 ? (
            <Vacio ico="equipo" titulo="Todavía no hay agentes cargados" />
          ) : (
            <>
              <PistaScroll />
              <div className="overflow-x-auto scroll">
                <table className="w-full min-w-[640px] border-collapse">
                  <thead>
                    <tr>
                      <Th>Agente</Th>
                      <Th ancho={150}>Tope de contacto</Th>
                      <Th ancho={110}>Estado</Th>
                      <Th ancho={220} alDer>
                        Acciones
                      </Th>
                    </tr>
                  </thead>
                  <tbody>
                    {ordenados.map((a) => (
                      <FilaAgente
                        key={a.id}
                        a={a}
                        onEditar={() => setEditarId(a.id)}
                        onBaja={() => setBajaId(a.id)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </Panel>
      </div>

      {alta && <ModalAgente agente={null} cerrar={() => setAlta(false)} />}
      {editando && <ModalAgente agente={editando} cerrar={() => setEditarId(null)} />}
      {dandoBaja && <ModalBaja a={dandoBaja} cerrar={() => setBajaId(null)} />}
    </div>
  );
}
