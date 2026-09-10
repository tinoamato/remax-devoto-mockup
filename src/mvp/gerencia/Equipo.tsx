import { useState } from "react";
import type { Asesor } from "../datos";
import { useApp } from "../tienda";
import { Boton, CabezaPanel, Campo, Etiqueta, Inicial, ItemMenu, Menu, Modal, Panel, Vacio } from "../../components/ui";

/* ── Configuración de la oficina ────────────────────────────── */

function ConfiguracionOficina() {
  const { e, d } = useApp();
  const [email, setEmail] = useState(e.emailGerencia);
  const sucio = email.trim() !== e.emailGerencia;
  const valido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const guardar = () => {
    if (!valido) return;
    d({ t: "config.set", cambio: { emailGerencia: email.trim() } });
  };

  return (
    <Panel>
      <CabezaPanel titulo="Configuración de la oficina" />
      <div className="p-3.5 space-y-3.5">
        <div className="flex items-end gap-2 max-w-[440px]">
          <Campo
            rotulo="Correo de gerencia"
            type="email"
            value={email}
            onChange={(ev) => setEmail(ev.target.value)}
            className="flex-1"
          />
          <Boton tono="primario" disabled={!sucio || !valido} onClick={guardar}>
            Guardar
          </Boton>
        </div>
        {sucio && !valido && (
          <p className="text-[11.5px] -mt-2" style={{ color: "var(--lacre)" }}>
            Ese formato de correo no es válido.
          </p>
        )}
        <p className="text-[11.5px] text-[var(--tinta-tenue)] max-w-[440px]">
          Es la casilla que usan las automatizaciones de «Gerencia» y la que aparece en copia oculta cuando una regla
          la esconde del agente.
        </p>

        <div className="pt-3 border-t border-[var(--linea-suave)]">
          <p className="rotulo mb-1.5">Todavía no configurable acá</p>
          <ul className="space-y-1 text-[12px] text-[var(--tinta-suave)]">
            <li>· Remitente y firma que llevan los correos salientes</li>
            <li>· Permisos: quién puede entrar como gerencia</li>
            <li>· Más de un destinatario en copia para gerencia</li>
          </ul>
        </div>
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
  const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
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
          className="w-[120px]"
        />
      </div>
    </Modal>
  );
}

/* ── Fila de agente ─────────────────────────────────────────── */

function FilaAgente({ a, onEditar }: { a: Asesor; onEditar: () => void }) {
  const { d } = useApp();

  return (
    <li className="flex items-center gap-3 px-3.5 py-2.5 border-b border-[var(--linea-suave)] last:border-b-0">
      <Inicial txt={a.iniciales} s={32} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-[13.5px] font-semibold truncate">{a.nombre}</h3>
          {!a.activo && <Etiqueta t="neutro">de baja</Etiqueta>}
        </div>
        <p className="text-[12px] text-[var(--tinta-suave)] truncate">{a.email}</p>
      </div>
      <div className="hidden sm:block text-right shrink-0 w-[120px]">
        <p className="num text-[12.5px] text-[var(--tinta-media)]">
          {a.antiguedadMeses} {a.antiguedadMeses === 1 ? "mes" : "meses"}
        </p>
        <p className="text-[11px] text-[var(--tinta-tenue)]">en la oficina</p>
      </div>
      <div className="hidden md:block text-right shrink-0 w-[110px]">
        <p className="num text-[12.5px] text-[var(--tinta-media)]">{a.topeContactoDias} días</p>
        <p className="text-[11px] text-[var(--tinta-tenue)]">tope de contacto</p>
      </div>
      <Menu
        disparador={(abrir) => (
          <Boton chico tono="fantasma" ico="puntos" onClick={abrir} aria-label={`Acciones para ${a.nombre}`} />
        )}
      >
        {(cerrarMenu) => (
          <>
            <ItemMenu
              ico="ajustes"
              onClick={() => {
                onEditar();
                cerrarMenu();
              }}
            >
              Editar datos
            </ItemMenu>
            {a.activo ? (
              <ItemMenu
                ico="cruz"
                peligro
                onClick={() => {
                  d({ t: "agente.baja", asesorId: a.id });
                  cerrarMenu();
                }}
              >
                Dar de baja
              </ItemMenu>
            ) : (
              <ItemMenu
                ico="tilde"
                onClick={() => {
                  d({ t: "agente.reactivar", asesorId: a.id });
                  cerrarMenu();
                }}
              >
                Reactivar
              </ItemMenu>
            )}
          </>
        )}
      </Menu>
    </li>
  );
}

/* ── Vista ──────────────────────────────────────────────────── */

export default function Equipo() {
  const { e } = useApp();
  const [alta, setAlta] = useState(false);
  const [editarId, setEditarId] = useState<string | null>(null);

  const activos = e.asesores.filter((a) => a.activo);
  const bajas = e.asesores.filter((a) => !a.activo);
  const editando = editarId ? e.asesores.find((a) => a.id === editarId) ?? null : null;

  return (
    <div className="h-full overflow-y-auto scroll p-4">
      <div className="max-w-[760px] mx-auto space-y-4">
        <ConfiguracionOficina />

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
              <ul>
                {activos.map((a) => (
                  <FilaAgente key={a.id} a={a} onEditar={() => setEditarId(a.id)} />
                ))}
              </ul>
              {bajas.length > 0 && (
                <>
                  <p className="rotulo px-3.5 py-1.5 bg-[var(--papel-hundido)]/60 border-y border-[var(--linea-suave)]">
                    De baja · {bajas.length}
                  </p>
                  <ul>
                    {bajas.map((a) => (
                      <FilaAgente key={a.id} a={a} onEditar={() => setEditarId(a.id)} />
                    ))}
                  </ul>
                </>
              )}
            </>
          )}
        </Panel>
      </div>

      {alta && <ModalAgente agente={null} cerrar={() => setAlta(false)} />}
      {editando && <ModalAgente agente={editando} cerrar={() => setEditarId(null)} />}
    </div>
  );
}
