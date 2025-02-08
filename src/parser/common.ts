import { AllTickets, Accomendation } from '../types';

export function appendTickets(
    allTickets: AllTickets,
    accomendation: Accomendation,
    rawTickets: string): void {
    if (!rawTickets) return;
    if (rawTickets === '有') {
        allTickets[accomendation] = '有';
    } else if (rawTickets === '无' || rawTickets === '--') {
        allTickets[accomendation] = 0;
    } else {
        allTickets[accomendation] = parseInt(rawTickets);
    }
}
