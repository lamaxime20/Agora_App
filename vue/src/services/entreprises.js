import entreprisesData from '../mockups/entreprises.json';

const DELAY = 500;

function simulateDelay() {
    return new Promise(resolve => setTimeout(resolve, DELAY));
}

export async function getEntreprises() {
    await simulateDelay();

    if (!entreprisesData.ok) {
        throw new Error('Impossible de charger vos entreprises.');
    }

    return entreprisesData.entreprises;
}
