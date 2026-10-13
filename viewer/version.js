// Version de l'outil PCB Net Tracer (viewer + pipeline), source unique.
// Semver MAJEUR.MINEUR.CORRECTIF : correctif -> +0.0.1, nouvelle fonction -> +0.1.0,
// changement incompatible (format de board.json, de config.json…) -> +1.0.0. Voir CHANGELOG.md.
// Chargé par la page et par le service worker (le nom du cache de la coquille en dépend) ; lu par le pipeline.
self.PCBNET_VERSION = { version: '1.3.0', date: '2026-10-13' };
