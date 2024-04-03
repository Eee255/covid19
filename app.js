const express = require('express')
const path = require('path')

const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const app = express()
app.use(express.json())

const dbPath = path.join(__dirname, 'covid19India.db')

let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3001, () => {
      console.log('Server Running at http://localhost:3001/')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}

initializeDBAndServer()

const convertState = eachState => {
  return {
    stateId: eachState.state_id,
    stateName: eachState.state_name,
    population: eachState.population,
  }
}

//get
app.get('/states/', async (request, response) => {
  const stateDetails = `
  SELECT 
  *
   FROM state
   OREDER BY state_id;`
  const result = await db.all(stateDetails)
  response.send(result.map(eachState => convertState(eachState)))
  console.log(result.map(eachState => convertState(eachState)))
})

//get
app.get('/states/:stateId/', async (request, response) => {
  const {stateId} = request.params
  const stateIndividual = `
  SELECT * FROM state 
  WHERE state_id = ${stateId};`
  const result1 = await db.get(stateIndividual)
  response.send(result1)
})

//post
app.post('/districts/', async (request, response) => {
  const {districtName, stateId, cases, cured, active, deaths} = request.body
  const postStates = `
  INSERT INTO 
  district (district_name, state_id, cases, cured, active, deaths)
  VALUES (
    '${districtName}',
    ${stateId},
    ${cases},
    ${cured},
    ${active},
    ${deaths}
  );`
  await db.run(postStates)
  response.send('District Successfully Added')
})

//get
app.get('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const districtIndividual = `
  SELECT * FROM district 
  WHERE state_id = ${districtId};`
  const resultDistrict = await db.get(districtIndividual)
  response.send(resultDistrict)
})

//delete
app.delete('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const deleteDistrict = `
  DELETE FROM district
  WHERE district_id = ${districtId};`
  db.run(deleteDistrict)
  response.send('District Removed')
})
//
app.put('/districts/:districtId/', async (request, response) => {
  const {districtName, stateId, cases, cured, active, deaths} = request.body
  const {districtId} = request.params
  const updateDistrict = `
            UPDATE district 
            SET 
                district_name='${districtName}',
                state_id=${stateId},
                cases=${cases},
                cured=${cured},
                active=${active},
                deaths=${deaths}
            WHERE district_id=${districtId};`
  await db.run(updateDistrict)
  response.send('District Details Updated')
})

//
app.get('/states/:stateId/stats/', async (request, response) => {
  const {stateId} = request.params
  const stateStats = `
  SELECT 
    sum(cases),
    sum(cured),
    sum(active),
    sum(deaths)
  FROM district
  WHERE state_id = ${stateId};`
  const stateGet = await db.get(stateStats)
  response.send({
    totalCases: stateGet['sum(cases)'],
    totalCured: stateGet['sum(cured)'],
    totalActive: stateGet['sum(active)'],
    totalDeaths: stateGet['sum(deaths)'],
  })
})
//
