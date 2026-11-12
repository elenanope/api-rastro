### Ejercicio 0:

```bash
 ! [remote rejected] main -> main (push declined due to repository rule violations)
```

### Pregunta 1:
El código que se recibe al hacer una llamada con MongoDB parado es:

`Error 500 -> {"error":"Error interno del servidor"}`

Se envía a raíz del bloque 5 de index.ts

### Pregunta 2:
Lo que viene en la URL llega como texto, pero en la base de datos, price está guardado como número, por esa razón no encuentra el anuncio del iPhone.
Con ?category=Cars sí funciona porque category es texto en la URL y en la base de datos


### Pregunta 3:
La API ignora views y status porque desde listings.ts no recogemos esos datos, además de que les damos nuestros propios valores, así que se sobreescribirían
Si no los ignorara, alguien podría manipular anuncios y cambiar las visitas que tiene o por ejemplo poner que un articulo recién publicado está vendido

### Pregunta 4:
Mi patch no debe de cambiar la copia de la oferta de Sara, ya que debe de mantenerse la consistencia con la oferta que esta realizó, no es lo mismo haber ofrecido 30€ menos antes, que al bajar el precio original. Parecería que no ha hecho una oferta, o incluso peor: si Ana bajara el precio más de la rebaja que proponía Sara parecería muy raro. 

En resumen, la oferta de Sara debe mantenerse como una "imagen" del anuncio y reflejar los datos del momento en el que se hizo la oferta.

### Pregunta 5:
Ofertar por un anuncio vendido es 409 porque la petición es correcta: el formato es válido y el anuncio existe, lo único es que esta choca con el estado actual del anuncio

### Pregunta 6:
En esta API, MongoDB comprueba que cada documento tenga un _id único. El resto de cosas las compruebo yo:

Comprobar los tipos de cada variable, que los números no sean negativos, que ObjectId tenga el formato que debe, que existan los Ids referenciados y que por ejemplo el anuncio esté disponible