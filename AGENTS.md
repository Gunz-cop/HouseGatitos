# AGENTS.md

Guia obligatoria para cualquier agente, IDE con IA o asistente que trabaje en este repositorio.

## Prioridad

Antes de proponer, redactar o generar imagenes para `housegatitos.com`, lee este archivo completo.

Si el trabajo incluye imagenes para articulos, portadas, piezas embebidas o prompts visuales, estas reglas tienen prioridad editorial salvo que el usuario pida una excepcion explicita.

## Objetivo visual de House Gatitos

House Gatitos no usa imagenes con aspecto de stock generico ni gatos que parezcan renderizados, plasticos o artificiales. La direccion visual es:

- Fotografia realista y emocional.
- Estetica editorial premium, calida y creible.
- Gatos con presencia individual y comportamiento felino autentico.
- Escenas conectadas de forma exacta con el articulo.
- Iluminacion natural o cinematografica sutil, nunca exagerada.

La imagen debe parecer tomada para ese articulo en concreto, no reciclada de una biblioteca generica.

## Regla principal

Cada prompt debe nacer del angulo real del articulo:

- Si el articulo trata sintomas, la escena debe mostrar observacion, postura, contexto domestico y senales fisicas creibles.
- Si trata comportamiento, la escena debe capturar lenguaje corporal real y una accion plausible.
- Si trata nutricion, la escena debe mostrar alimento, utensilios y edad del gato de manera coherente.
- Si trata razas, la escena debe respetar rasgos morfologicos autenticos de esa raza, sin mezclar caracteristicas.
- Si trata cuidados, la escena debe enseñar una accion practica que un tutor reconoceria como real.

Nunca uses un prompt bonito pero intercambiable. La imagen debe ayudar a entender el articulo.

## Estilo obligatorio de prompt

Todo prompt de House Gatitos debe incluir, de forma natural, estos bloques:

1. Sujeto felino especifico
- Edad aproximada, tipo de pelaje, patron, complexión y rasgos distintivos.
- Si es una raza, describir rasgos reales de esa raza.

2. Accion o comportamiento observable
- Una sola accion principal, fisicamente plausible.
- Expresion y postura coherentes con el estado emocional descrito.

3. Entorno narrativo
- Hogar real, clinica, ventana, salon, cocina, dormitorio, transportin, arenero u otro contexto que corresponda al articulo.
- Objetos utiles para la historia, sin recargar la escena.

4. Luz y camara
- Luz natural suave, luz de manana, tarde, interior calido o nocturna controlada segun el caso.
- Fotografia editorial realista, lente y encuadre coherentes: primer plano, plano medio, macro o escena ambiental.
- Profundidad de campo suave cuando aporte enfoque al sujeto.
- Relación de aspecto explícita en los parámetros finales (`--ar 16:9` para portada/imagen destacada; `--ar 4:3` o `--ar 1:1` para miniaturas/tarjetas).

5. Acabado visual
- Textura real del pelaje, bigotes, ojos, patas y superficies.
- Colorimetria sobria, elegante y natural.
- Sin look de ilustracion, sin CGI, sin surrealismo.
- Emplear sufijos de realismo fotográfico neutro (como `--style raw` en Midjourney).

## Formula base recomendada

Usa esta estructura y adaptala al articulo:

`Fotografia editorial hiperrealista de [gato exacto] [realizando accion concreta] en [entorno especifico], con [detalles narrativos utiles]. Iluminacion [tipo de luz], atmosfera [emocion o tono], encuadre [tipo de plano], profundidad de campo suave, texturas naturales del pelaje, ojos y entorno, aspecto fotografico premium, autentico y documental, sin apariencia de imagen de stock.`

## Estandares de calidad

El gato debe sentirse vivo y concreto:

- Mirada con intencion, no vacia.
- Postura anatomica correcta.
- Patas, cola, orejas y bigotes bien resueltos.
- Pelaje con textura real, no masa borrosa o plastica.
- Interaccion verosimil con humanos (preferir tomas de manos interactuando o personas en segundo plano desenfocadas para mantener el protagonismo en el gato), juguetes, comida o mobiliario.

La escena debe sentirse observada, no fabricada:

- Desorden minimo creible cuando convenga.
- Materiales reales: tela, madera, ceramica, metal, sisal, manta, suelo, sofa.
- Fondos utiles pero discretos.

## Lo que se debe evitar siempre

- Gatos con anatomia rara, ojos deformes o patas imposibles.
- Estetica de banco de imagen barato.
- Sonrisas humanas o expresiones caricaturescas.
- Exceso de accesorios, vestuario o decoracion irrelevante.
- Luces neon, colores chillones o dramatismo falso, salvo que el tema lo exija y siga viendose real.
- Escenas demasiado limpias, vacias o impersonales.
- Prompts vagos del tipo "un gato bonito en casa".
- Mezclar varias ideas en una sola imagen si eso debilita el mensaje.

## Indicaciones negativas recomendadas

Cuando el sistema lo permita, añade negativas alineadas con House Gatitos:

- `sin estilo stock`
- `sin ilustracion`
- `sin render 3D`
- `sin anatomia incorrecta`
- `sin rasgos duplicados`
- `sin ojos irreales`
- `sin manos humanas deformes`
- `sin exceso de utileria`
- `sin texto sobreimpreso`
- `sin look publicitario artificial`

## Tono visual por tipo de articulo

- Salud: serio, calmado, observacional, limpio, empatico.
- Comportamiento: intimo, atento, expresivo, domestico real.
- Nutricion: higienico, natural, practico, apetecible sin estilismo falso.
- Razas: descriptivo, elegante, preciso, centrado en morfologia y temperamento.
- Curiosidades o historias: cinematografico sutil, emocional, con sentido narrativo.

## Regla de precision felina

No describas un gato generico si el articulo exige precision. Si el tema es un Persa, un Sokoke, un Thai o un gatito recien nacido, el prompt debe reflejar edad, estructura corporal, tipo de cara, manto, ojos y contexto correctos.

Si la raza o etapa vital no estan claras en el articulo, usa un gato domestico creible y especifico, no uno abstracto.

## Entregable minimo cuando se pidan prompts

Cada propuesta visual debe incluir:

- `SEO Name`
- `Prompt`
- `Alt`
- `Caption`
- `Notas de realismo`

Las `Notas de realismo` deben explicar en una linea por que esa escena se siente autentica y por que conecta con el articulo.

## Checklist antes de cerrar

Antes de dar por buenos los prompts, verifica:

- ¿La escena ayuda a entender el articulo y no solo a decorarlo?
- ¿El gato se siente real y unico?
- ¿La luz es bonita pero creible?
- ¿El entorno aporta contexto sin robar protagonismo?
- ¿La imagen evita por completo el look de stock o de IA obvia?
- ¿La postura, edad y rasgos del gato coinciden con el tema?

Si alguna respuesta es "no", reescribe el prompt.
