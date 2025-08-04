/**
 * Script de test pour valider les mises à jour de statut instantanées
 * À utiliser dans la console du navigateur pour tester les fonctionnalités
 */

console.log("🧪 Test des mises à jour de statut instantanées");

// Test 1: Vérifier que les données JSON sont disponibles
function testJSONDataAvailability() {
  console.log("\n=== Test 1: Disponibilité des données JSON ===");

  if (!window.allDeliveries) {
    console.error("❌ window.allDeliveries n'est pas disponible");
    return false;
  }

  console.log(
    `✅ Nombre de livraisons chargées: ${window.allDeliveries.length}`
  );

  let jsonSyncCount = 0;
  let legacyCount = 0;

  window.allDeliveries.forEach((delivery, idx) => {
    if (
      delivery.container_numbers_list &&
      Array.isArray(delivery.container_numbers_list)
    ) {
      jsonSyncCount++;
      console.log(
        `✅ Delivery ${idx + 1}: Données JSON disponibles (${
          delivery.container_numbers_list.length
        } TC)`
      );
    } else {
      legacyCount++;
      console.log(`⚠️ Delivery ${idx + 1}: Données legacy uniquement`);
    }
  });

  console.log(
    `📊 Résumé: ${jsonSyncCount} synchronisées, ${legacyCount} à synchroniser`
  );
  return true;
}

// Test 2: Simuler une synchronisation forcée
function testForcedSync() {
  console.log("\n=== Test 2: Synchronisation forcée ===");

  if (typeof window.forceSyncAllDeliveries === "function") {
    console.log("🔄 Lancement de la synchronisation forcée...");
    window.forceSyncAllDeliveries().then((result) => {
      if (result) {
        console.log(
          `✅ Synchronisation terminée: ${result.syncCount} réussies, ${result.errorCount} échecs`
        );
      }
    });
  } else {
    console.error("❌ Fonction forceSyncAllDeliveries non disponible");
    return false;
  }

  return true;
}

// Test 3: Simuler une propagation de statut
function testStatusPropagation(deliveryId = null) {
  console.log("\n=== Test 3: Propagation de statut ===");

  if (!deliveryId && window.allDeliveries.length > 0) {
    deliveryId = window.allDeliveries[0].id;
  }

  if (!deliveryId) {
    console.error("❌ Aucune livraison disponible pour le test");
    return false;
  }

  if (typeof window.propagateStatusToAllTCs === "function") {
    console.log(`🔄 Test de propagation pour delivery ${deliveryId}...`);
    window.propagateStatusToAllTCs(deliveryId, "livre");
  } else {
    console.error("❌ Fonction propagateStatusToAllTCs non disponible");
    return false;
  }

  return true;
}

// Test 4: Vérifier l'affichage des cellules de statut
function testStatusCellDisplay() {
  console.log("\n=== Test 4: Affichage des cellules de statut ===");

  const statusCells = document.querySelectorAll("td[data-col-id='statut']");
  console.log(`📊 Nombre de cellules statut trouvées: ${statusCells.length}`);

  statusCells.forEach((cell, idx) => {
    const row = cell.closest("tr[data-delivery-id]");
    if (row) {
      const deliveryId = row.getAttribute("data-delivery-id");
      const delivery = window.allDeliveries.find(
        (d) => String(d.id) === String(deliveryId)
      );

      if (delivery) {
        let tcCount = 0;
        if (
          delivery.container_numbers_list &&
          Array.isArray(delivery.container_numbers_list)
        ) {
          tcCount = delivery.container_numbers_list.length;
          console.log(
            `✅ Cellule ${
              idx + 1
            }: Delivery ${deliveryId} - ${tcCount} TC (JSON)`
          );
        } else {
          console.log(
            `⚠️ Cellule ${idx + 1}: Delivery ${deliveryId} - données legacy`
          );
        }
      }
    }
  });

  return true;
}

// Test 5: Vérifier les cellules TC
function testTCCellDisplay() {
  console.log("\n=== Test 5: Affichage des cellules TC ===");

  const tcCells = document.querySelectorAll(
    "td[data-col-id='container_number']"
  );
  console.log(`📊 Nombre de cellules TC trouvées: ${tcCells.length}`);

  tcCells.forEach((cell, idx) => {
    const multiCell = cell.classList.contains("tc-multi-cell");
    const btnCount = cell.querySelectorAll(".tc-tags-btn").length;
    const tagCount = cell.querySelectorAll(".tc-tag").length;

    console.log(
      `📋 Cellule TC ${
        idx + 1
      }: Multi=${multiCell}, Boutons=${btnCount}, Tags=${tagCount}`
    );
  });

  return true;
}

// Fonction principale de test
function runAllTests() {
  console.log("🚀 Lancement de tous les tests...");

  const tests = [
    testJSONDataAvailability,
    testForcedSync,
    testStatusCellDisplay,
    testTCCellDisplay,
  ];

  let passedTests = 0;

  tests.forEach((test, idx) => {
    try {
      if (test()) {
        passedTests++;
      }
    } catch (error) {
      console.error(`❌ Test ${idx + 1} échoué:`, error);
    }
  });

  console.log(`\n🏁 Résultats: ${passedTests}/${tests.length} tests réussis`);

  if (passedTests === tests.length) {
    console.log("🎉 Tous les tests sont passés !");
  } else {
    console.log("⚠️ Certains tests ont échoué, vérifiez les logs ci-dessus");
  }
}

// Exposer les fonctions de test
window.testStatusUpdate = {
  runAll: runAllTests,
  testJSON: testJSONDataAvailability,
  testSync: testForcedSync,
  testPropagation: testStatusPropagation,
  testStatusCells: testStatusCellDisplay,
  testTCCells: testTCCellDisplay,
};

console.log(
  "✅ Script de test chargé. Utilisez 'testStatusUpdate.runAll()' pour lancer tous les tests"
);
