/**
 * Curriculum aggregator — imports the Nimiq skill and the enrichment
 * maps, and exposes a single merge entry point for kb.js.
 */
import { NIMIQ_SKILL, NIMIQ_KB } from './curriculum/nimiq.js';
import { ENRICH_A } from './curriculum/enrich-a.js';
import { ENRICH_B } from './curriculum/enrich-b.js';

export { NIMIQ_SKILL, NIMIQ_KB };

/** All topic enrichments merged: skill slug → topic slug → enrichment. */
export const ENRICH = { ...ENRICH_A, ...ENRICH_B };
