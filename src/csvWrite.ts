import {createObjectCsvWriter} from 'csv-writer';
import {VehicleData} from './index';
import config from './config';

export default function csvWrite(vehicleData: VehicleData) {
    const csvWriter = createObjectCsvWriter({
        path: config.outputCsvPath,
        header: [
            'row_id',
            'vehicle_id',
            'latitude',
            'longitude',
            'distance_from_prev_point',
            'worker_id',
        ].map(column => ({id: column, title: column}))
    });

    // The order of the records is saved throughout the process
    csvWriter.writeRecords(Object.values(vehicleData))
        .then(() => console.log('Finished writing the csv!'))
        .catch(() => console.log('Error writing the csv!'))
        .then(() => process.exit());
}