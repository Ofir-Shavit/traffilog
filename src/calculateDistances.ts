import {VehicleData} from './index';

export default function calculateDistances(worker_id: string, vehicleData: VehicleData, rowsIds: string[]): VehicleData {

    class Point {
        private readonly latitude: number;
        private readonly longitude: number;

        constructor(latitude: number, longitude: number) {
            this.latitude = latitude;
            this.longitude = longitude;
        }

        calculateDistance(latitude: number, longitude: number) {
            return Math.sqrt((this.latitude - latitude) ** 2 + (this.longitude - longitude) ** 2);
        }
    }

    let pointsCalculation: VehicleData = {};

    // Calculating distance only from the vehicle's second point
    for (let i = 0; i < rowsIds.length; i++) {

        const {latitude, longitude, row_id} = vehicleData[rowsIds[i]];
        let distance = 0;

        if (i) {
            const point = new Point(latitude, longitude);
            const {latitude: prevLatitude, longitude: prevLongitude} = vehicleData[rowsIds[i - 1]];
            distance = point.calculateDistance(prevLatitude, prevLongitude);
        }

        pointsCalculation[row_id] = Object.assign(vehicleData[rowsIds[i]],
            {distance_from_prev_point: distance, worker_id});
    }

    return pointsCalculation;
}