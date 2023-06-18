const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass
function list(req,res){
    res.json({ data: orders});
}

function fieldsValidation(req,res,next){
    const { data: { deliverTo, mobileNumber, dishes } = {} } = req.body;
    if (!deliverTo || deliverTo === "") {
        next({
            status: 400,
            message: "Dish must include a deliverTo",
        });
    }
    if (!mobileNumber || mobileNumber === "") {
        next({
            status: 400,
            message: "Dish must include a mobileNumber",
        });
    }
    if (!dishes) {
        next({
            status: 400,
            message: "Order must include a dish",
        });
    }
    if (!Array.isArray(dishes) || dishes.length < 1) {
        next({
            status: 400,
            message: "Order must include at least one dish",
        });
    }
    return next();
}

function create(req,res,next){
    const { data: { deliverTo, mobileNumber, dishes } = {} } = req.body;
    for (let index = 0; index < dishes.length; index++) {
        if (!dishes[index].quantity || !Number.isInteger(dishes[index].quantity) || dishes[index].quantity <= 0) {
            next({
                status: 400,
                message: `Dish ${index} must have a quantity that is an integer greater than 0`,
            });
            break;
        }
    }
    const newOrder = {
        id: nextId(),
        ...req.body.data
    };
    orders.push(newOrder);
    res.status(201).json({ data: newOrder });
}

function read(req,res,next){
    const { orderId } = req.params;
    const foundOrder = orders.find((order) => order.id === orderId);
    if (foundOrder) {
        res.json({ data: foundOrder });
    } 
    else {
        return next({
            status: 404,
            message: `Order id not found: ${orderId}`,
        });
    }
}

function orderExists(req,res,next){
    const { orderId } = req.params;
    const foundOrder = orders.find((order) => order.id === orderId);
    if (!foundOrder) {
        return next({
            status: 404,
            message: `Order does not exist: ${orderId}`,
        });
    }
    return next();
}

function updateValidation(req,res,next){
    const { data: { id, deliverTo, mobileNumber, dishes, status } = {} } = req.body;
    const { orderId } = req.params;
    const foundOrder = orders.find((order) => order.id === orderId);
    // if Id is present in body
    if(id){
        if(id !== orderId){
            return next({
                status: 400,
                message: `Order id does not match route id. Order: ${id}, Route: ${orderId}.`,
            });
        }
    }
    if(!status || status === "" || !['pending', 'preparing', 'out-for-delivery', 'delivered'].includes(status)){
        return next({
            status: 400,
            message: "Order must have a status of pending, preparing, out-for-delivery, delivered",
        });
    }
    for (const dish of dishes) {
        if(!'quantity' in dish){
            return next({
                status: 400,
                message: "Dish quantity must not be less than 1",
            });
        }
        if(dish.quantity === 0){
            return next({
                status: 400,
                message: "Dish quantity must be greater than 0",
            });
        }
        if(!Number.isInteger(dish.quantity)){
            return next({
                status: 400,
                message: "Dish quantity must be a number from 1 - 2",
            });
        }
    }
    return next();
}

function update(req,res,next){
    const { orderId } = req.params;
    const data = req.body.data;
    const foundOrder = orders.find((order) => order.id === orderId);
    if(data.status === "delivered"){
        return next({
            status: 400,
            message: "A delivered order cannot be changed",
        });
    }
    // Update order
    for (const key in data) {
        foundOrder[key] = data[key];
    }
  
    foundOrder.id = !data.id ? orderId : data.id;

    res.json({ data: foundOrder});
}

function destroy(req,res,next){
    const { orderId } = req.params;
    const foundOrder = orders.find((order) => order.id === orderId);
    if (!foundOrder) {
        return next({
            status: 404,
            message: `Dish does not exist: ${orderId}`,
        });
    }
    if(foundOrder.status !== "pending"){
        return next({
            status: 400,
            message: "An order cannot be deleted unless it is pending",
        });
    }
    const index = orders.findIndex((order) => order.id === orderId);

    orders.splice(index, 1);
    res.sendStatus(204);
}

module.exports = {
    list,
    create: [
        fieldsValidation,
        create
    ],
    read,
    update: [
        orderExists,
        fieldsValidation,
        updateValidation,
        update
    ],
    destroy
};