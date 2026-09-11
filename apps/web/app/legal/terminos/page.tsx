import type { Metadata } from 'next'
import Link from 'next/link'
import { LegalContentPage } from '@/components/legal/legal-page'
import { TERMS_UPDATED_AT_LABEL } from '@/lib/legal/terms'

export const metadata: Metadata = {
  title: 'Términos y Condiciones — Elite Forge',
}

/**
 * Texto legal aprobado (docs: terminos-y-condiciones-elite-forge.md) transcrito
 * tal cual, sin parafrasear — si hay que cambiar una palabra, se cambia en el
 * documento fuente primero. La fecha NO vive acá: sale de TERMS_VERSION en
 * lib/legal/terms.ts (fecha de publicación), la misma que el registro guarda
 * como versión aceptada. Al republicar los términos, cambiar esa constante.
 */
const UPDATED_AT = TERMS_UPDATED_AT_LABEL
const SUPPORT_EMAIL = 'soporte@eliteforge.tech'

export default function TerminosPage() {
  return (
    <LegalContentPage title="Términos y Condiciones" updatedAt={UPDATED_AT}>
      <p>
        Estos términos explican qué es Elite Forge, qué podés esperar de nosotros y qué esperamos
        de vos al usar la app. Están escritos para que los entienda cualquier persona, sin
        formación legal. Si algo no queda claro, escribinos.
      </p>
      <p>
        Al crear una cuenta en Elite Forge, aceptás estos términos y nuestra{' '}
        <Link href="/legal/privacidad">Política de Privacidad</Link>.
      </p>

      <hr />

      <h2>1. ¿Quién está detrás de Elite Forge?</h2>
      <p>
        Elite Forge es operado por David Leandro Calvo Salazar{' '}
        {'("nosotros", "Elite Forge")'}, con domicilio en Colombia. Para cualquier consulta sobre
        estos términos, podés escribirnos a:
      </p>
      <p>
        <strong>{SUPPORT_EMAIL}</strong>
      </p>

      <h2>2. ¿Qué es Elite Forge y qué no es?</h2>
      <p>
        Elite Forge es una app para jugadores de fútbol amateur: te permite crear un perfil de
        jugador con tus tests físicos y estadísticas, armar grupos con tu gente, organizar
        partidos, buscar un jugador que falte ({'"comodín"'}), reservar canchas registradas en la
        plataforma y participar en campeonatos organizados por Elite Forge.
      </p>
      <p>
        <strong>Elite Forge es una herramienta de organización.</strong> No somos un club, una
        liga profesional, una escuela ni una empresa de eventos deportivos. No organizamos,
        dirigimos ni supervisamos los partidos que se arman a través de la app: eso lo hacen los
        jugadores, entre ellos, en el mundo real.
      </p>

      <h2>3. ¿Quién puede usar Elite Forge?</h2>
      <ul>
        <li>
          Tenés que ser <strong>mayor de 18 años</strong>. Si detectamos una cuenta de una persona
          menor de edad, la vamos a desactivar (es la misma regla que en nuestra Política de
          Privacidad).
        </li>
        <li>
          Los datos de tu cuenta tienen que ser <strong>verdaderos</strong>: tu nombre real y un
          correo al que tengas acceso. El correo es la única vía para recuperar tu cuenta si
          olvidás la contraseña.
        </li>
        <li>
          <strong>Una cuenta por persona.</strong> No podés crear varias cuentas ni usar la cuenta
          de otro.
        </li>
        <li>
          Tu contraseña es tuya: no la compartas. Lo que se haga desde tu cuenta cuenta como hecho
          por vos, así que si sospechás que alguien más entró, cambiala o escribinos.
        </li>
      </ul>

      <h2>4. ¿Cómo esperamos que te comportes?</h2>
      <p>
        Elite Forge funciona porque la gente confía en la gente con la que va a jugar. Por eso
        está prohibido:
      </p>
      <ul>
        <li>
          Publicar contenido ofensivo, discriminatorio, violento o sexual, en el feed, en los
          comentarios, en tu perfil o en el nombre o la foto de un grupo.
        </li>
        <li>Hacerte pasar por otra persona o por un grupo que no es tuyo.</li>
        <li>Acosar, amenazar o intimidar a otros usuarios, dentro o fuera de la cancha.</li>
        <li>
          Usar la app para spam, publicidad no pedida o cualquier fin distinto de jugar y
          organizar partidos.
        </li>
        <li>
          Manipular tus estadísticas o tus tests: cargar resultados falsos, repetir tests fuera de
          las reglas de la app o alterar de cualquier forma los datos que otros jugadores ven de
          vos.
        </li>
        <li>
          Intentar acceder a cuentas ajenas, a nuestros servidores o a datos que no son tuyos.
        </li>
      </ul>

      <h2>5. ¿Qué pasa si alguien rompe estas reglas?</h2>
      <p>Nos comprometemos a este criterio, y lo cumplimos:</p>
      <ol>
        <li>
          <strong>Primero, una advertencia.</strong> Ante una conducta prohibida, la primera
          medida es una advertencia con el motivo, para que tengas la oportunidad de corregirla.
        </li>
        <li>
          <strong>Si reincidís, suspendemos la cuenta.</strong> La suspensión puede ser temporal o
          definitiva según la gravedad, y siempre con el motivo.
        </li>
      </ol>
      <p>
        No suspendemos cuentas sin advertencia previa. La única excepción son conductas que
        pongan en riesgo la seguridad de otras personas o de la plataforma (por ejemplo, amenazas
        o intentos de acceder a cuentas ajenas): en esos casos podemos suspender de inmediato, y
        aun así te comunicamos el motivo.
      </p>
      <p>
        Si creés que una advertencia o una suspensión fue un error, escribinos a{' '}
        <strong>{SUPPORT_EMAIL}</strong> y lo revisamos.
      </p>

      <h2>6. Partidos: lo que pasa en la cancha</h2>
      <p>
        Los partidos que se organizan con Elite Forge ocurren en el mundo físico, entre personas
        adultas que deciden jugar. Queremos ser claros sobre esto, sin rodeos:
      </p>
      <ul>
        <li>
          <strong>Vos decidís con quién jugás, dónde y cómo.</strong> Elite Forge te da las
          herramientas para organizarlo, pero no está presente en el partido ni lo supervisa.
        </li>
        <li>
          <strong>No nos responsabilizamos por lo que ocurra en la cancha:</strong> lesiones,
          daños a personas o cosas, conflictos entre jugadores, incumplimientos de quien dijo que
          iba y no fue, ni por el estado del lugar donde se juega.
        </li>
        <li>
          La función de comodín conecta tu partido con jugadores que no son de tu grupo. Aceptar a
          un comodín, y presentarte como comodín en un partido ajeno, es una decisión tuya; te
          pedimos el mismo cuidado que tendrías al jugar con desconocidos fuera de la app.
        </li>
      </ul>
      <p>Jugá con cuidado, con gente de confianza y en lugares seguros.</p>

      <h2>7. Reservas de cancha</h2>
      <p>
        A través de Elite Forge podés pedir una reserva en una cancha registrada en la
        plataforma. Cómo funciona:
      </p>
      <ul>
        <li>
          Elite Forge <strong>conecta</strong> a los jugadores con los dueños de las canchas.{' '}
          <strong>No procesamos pagos</strong> ni cobramos por las reservas: cualquier pago se
          acuerda y se hace directamente entre vos y el dueño de la cancha, fuera de la app.
        </li>
        <li>
          Una reserva <strong>nace pendiente</strong> y{' '}
          <strong>la aprueba o la rechaza el dueño de la cancha</strong>. Hasta que te llegue la
          confirmación, no tenés la cancha. Elite Forge no garantiza que una reserva sea aceptada
          ni que la cancha esté disponible o en las condiciones que esperás.
        </li>
        <li>
          El acuerdo de la reserva es <strong>entre vos y el dueño</strong>. Precios, horarios,
          cancelaciones y cualquier diferencia se resuelven entre las partes. Nosotros mostramos
          la información que el dueño carga, pero no la verificamos ni respondemos por ella.
        </li>
      </ul>

      <h2>8. Cuentas de dueños de cancha</h2>
      <p>
        Las cuentas de dueños de cancha (Empresarios) no se crean desde el registro público:{' '}
        <strong>las crea el administrador de Elite Forge</strong> y se entregan al dueño con una
        contraseña inicial. Al aceptar la cuenta, el dueño se compromete a:
      </p>
      <ul>
        <li>
          Cargar información veraz y actualizada de su complejo: canchas, tamaños, precios,
          servicios y disponibilidad.
        </li>
        <li>Responder las reservas pendientes en un plazo razonable y respetar las que confirmó.</li>
        <li>
          Tratar con respeto a los jugadores y cumplir con lo que la ley le exige como prestador
          de su servicio (permisos, seguridad del lugar, facturación).
        </li>
      </ul>
      <p>
        Elite Forge puede desactivar la cuenta de un dueño que incumpla estas obligaciones,
        siguiendo el mismo criterio de advertencia y suspensión de la sección 5.
      </p>

      <h2>9. Tu contenido es tuyo</h2>
      <p>
        Todo lo que subís a Elite Forge —tus publicaciones y comentarios en el feed, tu foto de
        perfil, las fotos de tus grupos, tus tests y estadísticas— <strong>es tuyo</strong>. Elite
        Forge solo lo aloja y lo muestra a las personas que corresponde (tu red, tu grupo, tu
        partido) para prestarte el servicio.
      </p>
      <p>
        <strong>No usamos tu contenido con fines promocionales ni comerciales.</strong> No lo
        vamos a poner en publicidad, en redes sociales ni en materiales de Elite Forge sin pedirte
        permiso expreso para ese caso puntual.
      </p>
      <p>
        Sos responsable de lo que publicás: tiene que ser tuyo o tener permiso para usarlo, y
        tiene que respetar la sección 4.
      </p>

      <h2>10. Lo que es de Elite Forge</h2>
      <p>
        La marca Elite Forge, el logo, el diseño de la app y de la web, el código y los textos son
        propiedad de Elite Forge. Podés usar la app para lo que está hecha; no podés copiar,
        modificar, revender ni hacer ingeniería inversa de la plataforma, ni usar la marca sin
        autorización.
      </p>

      <h2>11. Un producto en desarrollo</h2>
      <p>Elite Forge está en construcción y crece con lo que nos piden los jugadores. Eso significa que:</p>
      <ul>
        <li>
          Puede haber <strong>interrupciones</strong> del servicio, planificadas o no, y no
          garantizamos disponibilidad permanente.
        </li>
        <li>
          Las funciones <strong>pueden cambiar o desaparecer</strong> entre versiones.
        </li>
        <li>
          Puede haber errores. Si encontrás uno, contanos: es la forma más rápida de que se
          arregle.
        </li>
      </ul>
      <p>
        Hacemos lo razonable para que el servicio funcione bien, pero Elite Forge se ofrece{' '}
        <strong>tal cual está</strong>, sin garantía de que sirva para un fin particular.
      </p>

      <h2>12. ¿Cómo eliminás tu cuenta?</h2>
      <p>
        Escribinos a <strong>{SUPPORT_EMAIL}</strong> solicitando la eliminación de tu cuenta,
        desde el mismo correo con el que te registraste. Qué datos se eliminan y cuáles se
        conservan anonimizados está explicado en nuestra Política de Privacidad.{' '}
        <em>
          (Estamos trabajando en una opción para hacer esto directamente desde la app, sin
          necesidad de escribirnos — la vas a encontrar próximamente en Ajustes.)
        </em>
      </p>
      <p>
        También podés dejar de usar Elite Forge cuando quieras, sin trámite. Y nosotros podemos
        cerrar tu cuenta si incumplís estos términos, siguiendo el criterio de la sección 5.
      </p>

      <h2>13. Cambios a estos términos</h2>
      <p>
        Si hacemos cambios a estos términos, publicamos la versión nueva en esta misma página y
        actualizamos la fecha que figura al principio del documento. Si seguís usando Elite Forge
        después de un cambio, entendemos que lo aceptás; si no estás de acuerdo, podés eliminar
        tu cuenta.
      </p>

      <h2>14. Ley aplicable</h2>
      <p>
        Estos términos se rigen por las leyes de la República de Colombia. Cualquier diferencia la
        vamos a intentar resolver primero hablando, por correo; si no hay acuerdo, será
        competencia de los jueces de Colombia.
      </p>

      <h2>15. Contacto</h2>
      <p>
        <strong>{SUPPORT_EMAIL}</strong>
      </p>
    </LegalContentPage>
  )
}
