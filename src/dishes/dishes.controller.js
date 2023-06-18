const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass
function list(req,res){
    res.json({ data: dishes});
}

function dishExists(req,res,next){
    const { dishId } = req.params;
    const foundDish = dishes.find((dish) => dish.id === dishId);
    if (!foundDish) {
        return next({
            status: 404,
            message: `Dish does not exist: ${dishId}`,
        });
    }
    return next();
}
function fieldsValidation(req,res,next){
    const { data: { name, description, price, image_url } = {} } = req.body;
    if (!name || name === "") {
        next({
            status: 400,
            message: "Dish must include a name",
        });
    }
    if (!description || description === "") {
        next({
            status: 400,
            message: "Dish must include a description",
        });
    }
    if (!price) {
        next({
            status: 400,
            message: "Dish must include a price",
        });
    }
    if (price <= 0 || !Number.isInteger(price)) {
        next({
            status: 400,
            message: "Dish must have a price that is an integer greater than 0",
        });
    }
    if (!image_url || image_url === "") {
        next({
            status: 400,
            message: "Dish must include a image_url",
        });
    }
    return next();
}

function create(req,res){
    const data = req.body.data;
    const newDish = {
        id: nextId(),
        ...data
    };
    dishes.push(newDish);
    res.status(201).json({ data: newDish });
}

function read(req,res,next){
    const { dishId } = req.params;
    const foundDish = dishes.find((dish) => dish.id === dishId);
    if (foundDish) {
        res.json({ data: foundDish });
    } 
    else {
        return next({
            status: 404,
            message: `Dish id not found: ${dishId}`,
        });
    }
}

function updateValidation(req,res,next){
    const id = req.body.data.id;
    const { dishId } = req.params;
  
    // if Id is present in body
    if(id){
        if(id !== dishId){
            return next({
                status: 400,
                message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`,
            });
        }
    }
    return next();
}

function update(req,res,next){
    const { dishId } = req.params;
    const data = req.body.data;
    const foundDish = dishes.find((dish) => dish.id === dishId);
  
    // Update dish
    for (const key in data) {
        foundDish[key] = data[key];
    }

    res.json({ data: foundDish});
}

function destroy(req,res,next){
    const { dishId } = req.params;
    const foundDish = dishes.find((dish) => dish.id === dishId);
    if (!foundDish) {
        return next({
            status: 405,
            message: `Dish does not exist: ${dishId}`,
        });
    }
    const index = dishes.findIndex((dish) => dish.id === dishId);
  
    dishes.splice(index, 1);
    return next({
        status: 405,
        message: `Dish deleted!`,
    });
}

module.exports = {
    list,
    create: [
        fieldsValidation,
        create
    ],
    read,
    update: [
        dishExists,
        fieldsValidation,
        updateValidation,
        update
    ],
    destroy
};