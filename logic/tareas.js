const Tarea = require("../models/tarea");
const mongoose = require("mongoose");

/**
 * Crea un documento Tarea en la Base de datos.
 *
 * @param {object} tareaModel Objeto que se pretende crear.
 * @returns {Promise<Tarea>} Promise de Tarea creada.
 */
async function create(tareaModel) {
  const tarea = new Tarea(tareaModel);
  const tareaCreada = await tarea.save();
  console.info(`Tarea ${tareaCreada["id"]} creada exitosamente.`);
  return tareaCreada;
}

async function erase(id) {
  try {
    await Tarea.remove({_id:id});
  } catch (error) {
    console.error(`Error al intentar borrar ${error.name} : ${error.name}`);
  }

  return;
}

async function idUltimoRegistro(){
  try{
    console.info(`Entro `);
    let tareas = await Tarea.find({}).sort({$natural:-1}).limit(1);
    return tareas[0];
  }catch(error){
    console.error(`Explosao: ${error}`);
  }
}

async function getAll() {
  let tareas = await Tarea.find();
  console.info(`Se obtuvieron ${tareas.length} tareas.`);
  return tareas;
}

async function getOne(id) {
  console.debug(`Obteniendo tarea con id ${id}`);
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error("Invalid object Id ");
  }
  try {
    const tarea = await Tarea.findById(`${id}`);
    console.info(`Se obtuvo la tarea con id ${tarea["id"]}`);
    return tarea;
  } catch (error) {
    console.error(
      `No se pudo obtener la tarea con id ${id}, detalles ${error}`
    );
    throw error;
  }
}

async function update(id, newValues) {
  try {
    const tarea = new Tarea(newValues);
    const updatedModel = await Tarea.updateOne({ id: id }, newValues);
    console.info(id, newValues);
    return updatedModel;
  } catch (error) {
    console.error(`Error al intentar actualizar ${error.name} : ${error.name}`);
    throw new Error(`Error trying to update ${id}`);
  }
}

module.exports = {
  create,
  erase,
  getAll,
  getOne,
  update,
  idUltimoRegistro
};
