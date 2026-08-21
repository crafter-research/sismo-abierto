import { permanentRedirect } from "next/navigation";

/**
 * `/terreno/mapa` y `/terreno/lima` eran dos mapas urbanos por manzana en
 * páginas separadas, y nadie sabía cuál abrir. Ahora son uno: el mapa de Lima
 * absorbió la capa de suelo del IGP y los sismos recientes como capas que se
 * encienden encima.
 *
 * La fusión tiene un motivo medido, no solo de navegación: en el este de Lima
 * las dos capas cubren el mismo territorio (2,958 pares de polígonos en
 * Huaycán/Ate, 1,377 en Chosica), una midiendo el suelo y la otra el daño
 * esperado a la vivienda. Separadas en dos páginas, esa comparación no existía.
 *
 * Redirección permanente para no romper enlaces ya publicados.
 */
export default function TerrainMapPage(): never {
  permanentRedirect("/terreno/lima");
}
