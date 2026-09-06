import type { Metadata } from 'next'
import { LegalContentPage } from '@/components/legal/legal-page'

export const metadata: Metadata = {
  title: 'Política de privacidad — Elite Forge',
}

/**
 * Texto legal aprobado (docs: politica-de-privacidad-elite-forge.md) transcrito
 * tal cual, sin parafrasear — si hay que cambiar una palabra, se cambia en el
 * documento fuente primero. Fecha = día de publicación (merge), no de redacción.
 */
const UPDATED_AT = '6 de septiembre de 2026'
const SUPPORT_EMAIL = 'soporte@eliteforge.tech'

export default function PrivacidadPage() {
  return (
    <LegalContentPage title="Política de privacidad" updatedAt={UPDATED_AT}>
      <p>
        Esta política explica qué información recolecta Elite Forge, para qué la usa, cómo la
        protege, y qué derechos tenés sobre tus propios datos. Está redactada conforme a la Ley
        1581 de 2012 de Colombia (Ley de Protección de Datos Personales, también conocida como
        Habeas Data) y al Decreto 1377 de 2013 que la reglamenta.
      </p>
      <p>Al crear una cuenta en Elite Forge, aceptás esta política.</p>

      <hr />

      <h2>1. ¿Quién es el responsable de tus datos?</h2>
      <p>
        Elite Forge es operado por David Leandro Calvo Salazar{' '}
        {'("nosotros", "Elite Forge")'}, con domicilio en Colombia. Para cualquier consulta sobre
        esta política o sobre tus datos personales, podés escribirnos a:
      </p>
      <p>
        <strong>{SUPPORT_EMAIL}</strong>
      </p>

      <h2>2. ¿Qué datos recolectamos?</h2>

      <h3>2.1. Datos de cuenta y perfil</h3>
      <p>
        Nombre y apellido, correo electrónico, contraseña (guardada siempre de forma cifrada —
        nunca en texto plano, ni siquiera nuestro propio equipo puede leerla), alias único, foto
        de perfil (opcional), altura y peso (opcional), posición favorita en la cancha (opcional).
      </p>

      <h3>2.2. Ubicación aproximada</h3>
      <p>
        El municipio que elegís vos mismo de una lista fija de municipios de Colombia —{' '}
        <strong>nunca accedemos al GPS de tu dispositivo ni a tu ubicación exacta</strong>. Usamos
        esto para mostrarte canchas y partidos cerca tuyo.
      </p>

      <h3>2.3. Datos deportivos y de rendimiento (categoría especial)</h3>
      <p>
        Resultados de tests físicos y psicológicos que completás voluntariamente dentro de la app,
        y estadísticas de los partidos en los que participás (goles, atajadas, asistencias, etc.).{' '}
        <strong>
          Este tipo de dato puede considerarse un dato sensible de salud y estado físico.
        </strong>{' '}
        Lo usamos únicamente para construir tu ficha de jugador, tus estadísticas visibles a tu red
        de contactos dentro de la app, y los rankings de los campeonatos en los que participás.
        Nunca lo compartimos con nadie fuera de la plataforma.
      </p>

      <h3>2.4. Contenido que generás</h3>
      <p>
        Publicaciones, fotos, videos y comentarios que subís al feed, y las fotos de los grupos que
        creás.
      </p>

      <h3>2.5. Relaciones dentro de la app</h3>
      <p>
        Tus amistades con otros jugadores, tus grupos, tu participación en partidos y postulaciones
        a comodín.
      </p>

      <h3>2.6. Datos técnicos</h3>
      <p>
        El token de tu dispositivo para poder enviarte notificaciones (por ejemplo, avisarte que se
        abrió una vacante de comodín cerca tuyo).
      </p>

      <h3>2.7. Si administrás una cancha (Empresario)</h3>
      <p>
        Tu nombre y correo para tu cuenta del portal de administración, y — si cargás una reserva
        hecha por teléfono — el nombre y teléfono de ese cliente, que administrás vos mismo desde tu
        propio portal.
      </p>

      <h2>3. ¿Para qué usamos tus datos?</h2>
      <ul>
        <li>Crear y mantener tu cuenta y tu sesión.</li>
        <li>Mostrarte tu ficha de jugador y las de tu red (amigos, compañeros de grupo).</li>
        <li>
          Organizar partidos, grupos, torneos, reservas de cancha y la función de comodín.
        </li>
        <li>Calcular rankings de campeonatos.</li>
        <li>Enviarte notificaciones relevantes a tu actividad en la app.</li>
        <li>Brindarte soporte cuando nos escribís.</li>
        <li>Cumplir obligaciones legales cuando corresponda.</li>
      </ul>
      <p>
        <strong>No usamos tus datos para publicidad dirigida ni los vendemos a nadie.</strong>
      </p>

      <h2>4. ¿Compartimos tus datos con terceros?</h2>
      <p>
        <strong>No, hoy no compartimos ningún dato personal con terceros.</strong> Elite Forge
        funciona sobre infraestructura propia, sin servicios externos de analítica ni de
        publicidad.
      </p>
      <p>
        La única excepción técnica es el envío de notificaciones push, que requiere pasar el
        identificador de tu dispositivo (no tu identidad ni tu contenido) a través de los servicios
        de Google y Apple para que la notificación llegue a tu teléfono — es un requisito técnico
        de cómo funcionan las notificaciones en cualquier app, no una decisión nuestra de compartir
        tu información.
      </p>
      <p>
        Si en el futuro incorporamos algún servicio de terceros (por ejemplo, al lanzar una versión
        de Elite Forge para escuelas deportivas), actualizaremos esta política antes de que eso
        ocurra y te lo notificaremos.
      </p>

      <h2>5. ¿Tu información sale de Colombia?</h2>
      <p>
        Sí. Nuestros servidores están alojados en un proveedor de infraestructura con centros de
        datos en Estados Unidos. Esto implica una transferencia internacional de tus datos
        personales. Tomamos las medidas técnicas razonables para proteger tu información (cifrado
        en tránsito mediante HTTPS, contraseñas nunca almacenadas en texto plano) durante ese
        procesamiento, conforme lo permite la normativa colombiana para este tipo de
        transferencias.
      </p>

      <h2>6. ¿Cuánto tiempo guardamos tus datos?</h2>
      <ul>
        <li>
          Mientras tu cuenta esté activa, conservamos los datos necesarios para que la app
          funcione.
        </li>
        <li>
          Si solicitás la eliminación de tu cuenta, tus datos identificatorios (nombre, correo,
          foto) se eliminan o anonimizan de nuestra base de datos activa. El contenido que quedó
          enlazado con otras personas (por ejemplo, tu participación en el historial de un partido
          pasado, o en un grupo) se conserva de forma anonimizada (mostrado como{' '}
          {'"Usuario eliminado"'}), para no afectar los datos de otros usuarios.
        </li>
        <li>
          Tus datos pueden persistir hasta 14 días adicionales en nuestras copias de seguridad de
          respaldo, después de lo cual se eliminan también de ahí.
        </li>
      </ul>

      <h2>7. ¿Cómo pedís que se elimine tu cuenta o tus datos?</h2>
      <p>
        Escribinos a <strong>{SUPPORT_EMAIL}</strong> solicitando la eliminación de tu cuenta,
        desde el mismo correo con el que te registraste. Vamos a procesar tu solicitud conforme a
        los plazos que establece la ley colombiana.{' '}
        <em>
          (Estamos trabajando en una opción para hacer esto directamente desde la app, sin
          necesidad de escribirnos — la vas a encontrar próximamente en Ajustes.)
        </em>
      </p>

      <h2>8. Tus derechos sobre tus datos (Ley 1581)</h2>
      <p>Como titular de tus datos personales, tenés derecho a:</p>
      <ul>
        <li>
          <strong>Conocer</strong> qué datos tuyos tenemos y cómo los usamos.
        </li>
        <li>
          <strong>Actualizar y rectificar</strong> tu información si está desactualizada o es
          incorrecta (podés hacerlo vos mismo desde tu perfil, en la mayoría de los casos).
        </li>
        <li>
          <strong>Suprimir</strong> tus datos, cuando corresponda legalmente.
        </li>
        <li>
          <strong>Revocar</strong> la autorización que nos diste para tratar tus datos.
        </li>
        <li>
          <strong>Presentar quejas</strong> ante la Superintendencia de Industria y Comercio de
          Colombia, si considerás que no respetamos tus derechos.
        </li>
      </ul>
      <p>
        Para ejercer cualquiera de estos derechos, escribinos a <strong>{SUPPORT_EMAIL}</strong>.
      </p>

      <h2>9. ¿Quién puede usar Elite Forge?</h2>
      <p>
        Elite Forge está destinado a personas <strong>mayores de 18 años</strong>. Si detectamos
        una cuenta de una persona menor de edad, la vamos a desactivar.
      </p>

      <h2>10. Seguridad</h2>
      <p>
        Protegemos tu información con cifrado en el tránsito de datos (HTTPS) y contraseñas siempre
        almacenadas de forma cifrada, nunca en texto plano. Ningún sistema es 100% infalible, pero
        trabajamos activamente para mantener tu información segura.
      </p>

      <h2>11. Cambios a esta política</h2>
      <p>
        Si hacemos cambios importantes a esta política, te lo vamos a notificar dentro de la app
        antes de que entren en vigencia.
      </p>

      <h2>12. Contacto</h2>
      <p>
        <strong>{SUPPORT_EMAIL}</strong>
      </p>
    </LegalContentPage>
  )
}
