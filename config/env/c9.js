module.exports = {
    port: 8080,
    mongoPort: 27017,
    mongoDatabase:      "mydb",
    mongoCollectionName: "mycollection",
    mongoUrl:           process.env.MONGODB_URI
};