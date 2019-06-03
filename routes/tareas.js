const express = require("express");
const tareasLogic = require("../logic/tareas");
const bodyParser = require("body-parser");

const tareasRouter = express.Router();
tareasRouter.use(bodyParser.json());

/**
 * Función aplicada por defecto a todas las respuestas.
 * Aplica el código de estado 200 a la respuesta y la cabecera
 * Content-Type igual a application/json.
 *
 * Si algún método necesita usar otro código u otas cabeceras
 * puede hacerlo en el método mismo.
 *
 * @param {object} req Petición HTTP
 * @param {object} res Respuesta HTTP
 * @param {object} next siguiente middleware a ejecutarse
 */
function allRequest(req, res, next) {
  res.setHeader("Access-Control-Allow-Headers", "Accept,Content-Type","Access-Control-Allow-Origin");
  res.setHeader("Access-Control-Allow-Methods", "OPTIONS,GET,DELETE,PUT");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin","*");
  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json");
  next();
}

/**
 *
 * @param {object} req Petición HTTP
 * @param {object} res  Respuesta HTTP
 * @param {object} next  siguiente middleware a ejecutarse
 */
function showOptions(req, res, next) {
  res.setHeader("Access-Control-Allow-Headers", "Accept,Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "OPTIONS,GET,POST");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin","*");
  res.end();
}

function showOptionsPerResource(req, res, next) {
  res.setHeader("Access-Control-Allow-Headers", "Accept,Content-Type","Access-Control-Allow-Origin");
  res.setHeader("Access-Control-Allow-Methods", "OPTIONS,GET,DELETE,PUT");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin","*");
  res.end();
}

/**
 * Verifica que la cabecera Accept sea válida, para los endpoints que retornan JSON
 *
 * Se considera válido si es que no se envia la cabecera Accept, en cuyo caso el servicio
 * asume que retorna el contenido que soporta por defecto.
 * Y se considera válida la cabecera `application/json`, cualquiera otra cabecera produce
 * no es válida,
 *
 * Se hace una consideración especial cuando la cabecera `application/json` viene acompañada
 * de otros posibles valores como en el caso `application/json;charset=utf-8` en cuyo caso primero
 * separan los posibles valores y sólo se busca `application/json`.
 *
 * @param {string} acceptHeader Valor de la cabecera Accept de la petición
 * @returns true si es que la cabecera es válida según los criterios expuestos más arriba, y
 * false si es que no cumple los criterios.
 */
function validAcceptHeader(acceptHeader) {
  if (!acceptHeader && acceptHeader !== "") {
    return true;
  }

  if (!(acceptHeader instanceof String || typeof acceptHeader === "string")) {
    return false;
  }

  const acceptedTypes = acceptHeader.split(";").map(h => h.trim());
  if (acceptedTypes.includes("application/json")) {
    return true;
  } else {
    return false;
  }
}

/**
 * Verifica que el header Content-Type tenga el valor `application/json`, considerando que el cliente puede enviar
 * otros valores posibles como `charset=utf-8`. Este método no considera válido los valores nulos, vacíos o de
 * otro tipo que disinto a string.
 *
 * @param {string} contentTypeHeader valor de la cabecera Content-Type de la petición.
 * @returns true si es que el Content-Type es válido o false en caso contrario.
 */
function validContentTypeHeader(contentTypeHeader) {
  if (!contentTypeHeader) {
    return false;
  }

  if (
    !(
      contentTypeHeader instanceof String ||
      typeof contentTypeHeader === "string"
    )
  ) {
    return false;
  }

  const contentTypes = contentTypeHeader.split(";").map(h => h.trim());
  if (contentTypes.includes("application/json")) {
    return true;
  } else {
    return false;
  }
}

/**
 * Obtiene todas las tareas de la base de datos
 *
 * @param {object} req Petición HTTP
 * @param {object} res Respuesta HTTP
 */
async function obtenerTareas(req, res, next) {
  const acceptHeader = req.header("Accept");
  if (!validAcceptHeader(acceptHeader)) {
    res.statusCode = 400;
    res.setHeader("Access-Control-Allow-Headers", "Accept,Content-Type","Access-Control-Allow-Origin");
    res.setHeader("Access-Control-Allow-Methods", "OPTIONS,GET,DELETE,PUT");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Origin","*");
    res.send({
      details:
        "This endpoint only support 'application/json' media type, please verify your `Accept` header ",
      message: `Media not supported :  ${acceptHeader}`
    });
    res.end();
    return;
  }
  try{
    const tareas = await tareasLogic.getAll();
    res.setHeader("Access-Control-Allow-Headers", "Accept,Content-Type","Access-Control-Allow-Origin");
    res.setHeader("Access-Control-Allow-Methods", "OPTIONS,GET,DELETE,PUT");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Origin","*");
    res.send(tareas);
    res.end();
  } catch(error){
    res.statusCode = 400;
    res.setHeader("Access-Control-Allow-Headers", "Accept,Content-Type","Access-Control-Allow-Origin");
    res.setHeader("Access-Control-Allow-Methods", "OPTIONS,GET,DELETE,PUT");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Origin","*");
    res.send({
      message: `Ocurrio un error al obtener las tareas`,
      details: `El metodo arrojo el siguiente error: ${error}`
    });
    res.end();
  }
}

/**
 * Crea una tarea en la base de datos y retorna el objeto creado con un 
 * id válido.
 * 
 * @param {object} req Petición HTTP 
 * @param {object} res Respuesta HTTP
 */
async function crearTarea(req, res) {
  const contenTypeHeader = req.header("Content-Type");
  if (!validContentTypeHeader(contenTypeHeader)) {
    res.setHeader("Access-Control-Allow-Headers", "Accept,Content-Type","Access-Control-Allow-Origin");
    res.setHeader("Access-Control-Allow-Methods", "OPTIONS,GET,DELETE,PUT");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Origin","*");
    res.statusCode = 400;
    res.send({
      message: `Invalid Content-Type : ${contenTypeHeader}`,
      details: "This endpoint expected JSON object with attribute `description`"
    });
    res.end();
    return;
  }
  try{
    if(req==null || req == undefined || req.body==null || req.body == undefined || req.body.description == null || req.body.description == undefined){
      res.setHeader("Access-Control-Allow-Headers", "Accept,Content-Type","Access-Control-Allow-Origin");
      res.setHeader("Access-Control-Allow-Methods", "OPTIONS,GET,DELETE,PUT");
      res.setHeader("Access-Control-Allow-Credentials", "true");
      res.setHeader("Access-Control-Allow-Origin","*");
      res.statusCode = 400;
      res.send({
        message: "Parametro invalido ",
        details: "Se espera el atributo 'description' con valor distinto de nulo contenido en un JSON"
      });
      res.end();
      return;
    }

    const jsonBody = req.body;

    const modeloACrear = {
      description: jsonBody.description,
      status: "PENDIENTE"
    };

    const tareaCreada = await tareasLogic.create(modeloACrear);
    res.setHeader("Access-Control-Allow-Headers", "Accept,Content-Type","Access-Control-Allow-Origin");
    res.setHeader("Access-Control-Allow-Methods", "OPTIONS,GET,DELETE,PUT");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Origin","*");
    res.send(tareaCreada);
    res.end();
  }catch(error){
    res.setHeader("Access-Control-Allow-Headers", "Accept,Content-Type","Access-Control-Allow-Origin");
    res.setHeader("Access-Control-Allow-Methods", "OPTIONS,GET,DELETE,PUT");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Origin","*");
    res.statusCode = 400;
    res.send({
      message: `Ocurrio un error al intentar crear la tarea: ${modeloACrear.descripcion}`,
      details: `El metodo arrojo el siguiente error: ${error}`
    });
    res.end();
  }
}

/**
 * Obtiene una tarea dado su identificador idTarea
 * 
 * @param {object} req Petición HTTP.
 * @param {object} res Respuesta HTTP.
 */
async function obtenerTarea(req, res) {
  const {idTarea}  = req.params;
  try{
    const tarea = await tareasLogic.getOne(idTarea);
    res.setHeader("Access-Control-Allow-Headers", "Accept,Content-Type","Access-Control-Allow-Origin");
    res.setHeader("Access-Control-Allow-Methods", "OPTIONS,GET,DELETE,PUT");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Origin","*");
    res.send(tarea);
    res.end();
  }
  catch(error){
    res.statusCode = 400;
    res.setHeader("Access-Control-Allow-Headers", "Accept,Content-Type","Access-Control-Allow-Origin");
    res.setHeader("Access-Control-Allow-Methods", "OPTIONS,GET,DELETE,PUT");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Origin","*");
    res.send({
      message: `Can't find objecti with id : ${idTarea}`,
      details: "This endpoint expected a valid object identifier"
    });
    res.end();
  }
  
}

/**
 * Borrar una tarea dado su identificador idTarea
 * 
 * @param {object} req Petición HTTP.
 * @param {object} res Respuesta HTTP.
 */
async function eliminarTarea(req, res) {
  const {idTarea}  = req.params;
  try{
    const tarea = await tareasLogic.erase(idTarea);
    res.setHeader("Access-Control-Allow-Headers", "Accept,Content-Type","Access-Control-Allow-Origin");
    res.setHeader("Access-Control-Allow-Methods", "OPTIONS,GET,DELETE,PUT");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Origin","*");
    res.send(tarea);
    res.end();
  }
  catch(error){
    res.statusCode = 400;
    res.setHeader("Access-Control-Allow-Headers", "Accept,Content-Type","Access-Control-Allow-Origin");
    res.setHeader("Access-Control-Allow-Methods", "OPTIONS,GET,DELETE,PUT");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Origin","*");
    res.send({
      message: `No fue posible borrar la tarea con id: ${idTarea}`,
      details: `Error en el metodo: ${error}`
    });
    res.end();
  }
  
}

/**
 * Actualizar una tarea dado su identificador idTarea
 * 
 * @param {object} req Petición HTTP.
 * @param {object} res Respuesta HTTP.
 */
async function actualizarTarea(req, res) {
  try{
    if(req==null || req == undefined){
      res.setHeader("Access-Control-Allow-Headers", "Accept,Content-Type","Access-Control-Allow-Origin");
      res.setHeader("Access-Control-Allow-Methods", "OPTIONS,GET,DELETE,PUT");
      res.setHeader("Access-Control-Allow-Credentials", "true");
      res.setHeader("Access-Control-Allow-Origin","*");
      res.statusCode = 400;
      res.send({
        message: "Parametro invalido ",
        details: "Se esperan los atributos 'id','description' o 'status' con valor distinto de nulo contenido en un JSON"
      });
      res.end();
      return;
    } else {
      const id = req.params.idTarea;
      const desc = req.body.description;
      console.info('Descripcion '+desc);
      const est = req.body.status;
      console.info('Estado '+est);
      if (id==null || id==undefined){
        res.setHeader("Access-Control-Allow-Headers", "Accept,Content-Type","Access-Control-Allow-Origin");
        res.setHeader("Access-Control-Allow-Methods", "OPTIONS,GET,DELETE,PUT");
        res.setHeader("Access-Control-Allow-Credentials", "true");
        res.setHeader("Access-Control-Allow-Origin","*");
        res.statusCode = 400;
        res.send({
          message: "Parametro invalido ",
          details: "Se esperan el atributo 'id' con valor distinto de nulo contenido en un JSON"
        });
        res.end();
      return;
      }

      const modelo = {
        description: desc,
        status: est,
        date: new Date()
      };
    //verificamos si existe el id
      const ver = await tareasLogic.getOne(id);
      if(ver==null || ver==undefined){
        res.setHeader("Access-Control-Allow-Headers", "Accept,Content-Type","Access-Control-Allow-Origin");
        res.setHeader("Access-Control-Allow-Methods", "OPTIONS,GET,DELETE,PUT");
        res.setHeader("Access-Control-Allow-Credentials", "true");
        res.setHeader("Access-Control-Allow-Origin","*");
        res.statusCode = 400;
        res.send({
          message: "Id invalido ",
          details: "No se encuentra la tarea a ser modificada"
        });
        res.end();
        return;
      }else {
        const tarea = await tareasLogic.update(id,modelo);
        res.setHeader("Access-Control-Allow-Headers", "Accept,Content-Type","Access-Control-Allow-Origin");
        res.setHeader("Access-Control-Allow-Methods", "OPTIONS,GET,DELETE,PUT");
        res.setHeader("Access-Control-Allow-Credentials", "true");
        res.setHeader("Access-Control-Allow-Origin","*");
        res.send(tarea);
        res.end();
      }
    }
  }
  catch(error){
    res.statusCode = 400;
    res.setHeader("Access-Control-Allow-Headers", "Accept,Content-Type","Access-Control-Allow-Origin");
    res.setHeader("Access-Control-Allow-Methods", "OPTIONS,GET,DELETE,PUT");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Origin","*");
    res.send({
      message: `No fue posible actualizar la tarea con id: ${req.params.idTarea}`,
      details: `Error en el metodo: ${error}`
    });
    res.end();
  }
  
}

tareasRouter
  .route("/")
  .all(allRequest)
  .options(showOptions)
  .get(obtenerTareas)
  .post(crearTarea)
  .put((req, res, next) => {
    res.setHeader("Access-Control-Allow-Headers", "Accept,Content-Type","Access-Control-Allow-Origin");
    res.setHeader("Access-Control-Allow-Methods", "OPTIONS,GET,DELETE,PUT");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Origin","*");
    res.statusCode = 405;
    res.send({
      message: "PUT method is not supported on /tasks",
      details: "Error not found"
    });
    res.end();
  })
  .delete((req, res, next) => {
    res.setHeader("Access-Control-Allow-Headers", "Accept,Content-Type","Access-Control-Allow-Origin");
    res.setHeader("Access-Control-Allow-Methods", "OPTIONS,GET,DELETE,PUT");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Origin","*");
    res.statusCode = 405;
    res.send({
      message: "DELETE method is not supported on /tasks",
      details: "Error not found"
    });
    res.end();
  });

tareasRouter
  .route("/:idTarea")
  .all(allRequest)
  .options(showOptionsPerResource)
  .get(obtenerTarea)
  .post((req, res, next) => {
    res.setHeader("Access-Control-Allow-Headers", "Accept,Content-Type","Access-Control-Allow-Origin");
    res.setHeader("Access-Control-Allow-Methods", "OPTIONS,GET,DELETE,PUT");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Origin","*");
    res.statusCode = 405;
    res.send({
      message: "POST operation is not suported on /tareas/"+ req.params.idTarea,
      details: "Error not found"
    });
    res.end();
  })
  .put(actualizarTarea)
  .delete(eliminarTarea);

module.exports = tareasRouter;

