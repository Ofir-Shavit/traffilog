import fs from 'fs';
import csv from 'csv-parser';
import workerpool from 'workerpool';
import {v4 as uuidv4} from 'uuid';
import config from './config';
import calculateDistances from './calculateDistances';
import csvWrite from './csvWrite';


export interface VehicleCoordinate {
    row_id: string;
    vehicle_id: string;
    latitude: number;
    longitude: number;
    distance_from_prev_point?: string;
    worker_id?: string;
}

export interface VehicleData {
    [vehicle: string]: VehicleCoordinate;
}

interface VehicleGrouping {
    [row_id: string]: string[];
}

/* Object that stores all the data points
* key- row_id , value- point
*/
const vehicleData: VehicleData = {};
let vehiclesNumber: number;
/* Object that stores all the data points, grouped by vehicle_id
* key- vehicle_id , value- array of data for this vehicle
*/
const vehicleGrouping: VehicleGrouping = {};

const headers = ['row_id', 'vehicle_id', 'latitude', 'longitude'];

fs.createReadStream(config.inputCsvPath)
    .pipe(csv({
        // Instead of reading the headers, avoiding zero-width space characters
        mapHeaders: ({ index}) => headers[index]
    }))
    .on('data', (vehicleCoordinate: VehicleCoordinate) => {
        const rowId = vehicleCoordinate.row_id;
        // Adding point to data object
        vehicleData[rowId] = vehicleCoordinate;
        // Adding row_id string to vehicle grouping
        if (vehicleGrouping[vehicleCoordinate.vehicle_id]) {
            vehicleGrouping[vehicleCoordinate.vehicle_id].push(rowId);
        } else {
            vehicleGrouping[vehicleCoordinate.vehicle_id] = [rowId];
        }
    }).on('end', () => {
    vehiclesNumber = Object.keys(vehicleGrouping).length;
    console.log(`Starting processing ${vehiclesNumber} vehicles!`);

    const pool = workerpool.pool(null, {minWorkers: 'max', maxWorkers: config.workerPoolSize});

    // Worker pool automatically adds tasks to queue and execute when threads are available
    const tasks = Object.keys(vehicleGrouping).map((vehicle_id) => {
        return pool.exec(calculateDistances, [uuidv4(), vehicleData, vehicleGrouping[vehicle_id]]);
    });

    tasks.forEach((task) => {
        task.then((result) => {
            // Replacing data points with data points with distance and threadId
            Object.assign(vehicleData, result);
            vehiclesNumber--;
            // Write csv after all vehicles processed
            if (!vehiclesNumber) {
                csvWrite(vehicleData);
            }
        }).catch((error) => console.log('Error Occurred in worker thread!\n', error));
    });
});

