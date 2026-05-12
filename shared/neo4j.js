import neo4j from "neo4j-driver";
import env from "./env.js";


let driver;

const connectneo4j = async () => {
  try {
    driver = neo4j.driver(
      env.NEO4J_URI,
      neo4j.auth.basic(env.NEO4J_USER, env.NEO4J_PASSWORD)
    );
    await driver.getServerInfo();
    console.log("Neo4j connected");
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};

export { driver };
export default connectneo4j;



