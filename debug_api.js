const http = require("http");

function testAPI() {
  const options = {
    hostname: "localhost",
    port: 3000,
    path: "/deliveries/status",
    method: "GET",
  };

  const req = http.request(options, (res) => {
    let data = "";
    res.on("data", (chunk) => {
      data += chunk;
    });

    res.on("end", () => {
      try {
        const jsonData = JSON.parse(data);
        console.log("✅ API Status:", res.statusCode);
        console.log("✅ Success:", jsonData.success);
        console.log(
          "📦 Nombre de livraisons:",
          jsonData.deliveries ? jsonData.deliveries.length : 0
        );

        if (jsonData.deliveries && jsonData.deliveries.length > 0) {
          const delivery = jsonData.deliveries[0];
          console.log("\n📋 Première livraison:");
          console.log("   ID:", delivery.id);
          console.log("   container_number:", delivery.container_number);
          console.log(
            "   🆕 container_numbers_list:",
            delivery.container_numbers_list || "NON PRÉSENT"
          );
          console.log(
            "   🆕 container_foot_types_map:",
            delivery.container_foot_types_map || "NON PRÉSENT"
          );

          if (delivery.container_numbers_list) {
            try {
              const parsed = JSON.parse(delivery.container_numbers_list);
              console.log("   📝 Liste complète des TC:", parsed);
            } catch (e) {
              console.log("   ❌ Erreur parsing JSON:", e.message);
            }
          }
        }
      } catch (parseError) {
        console.error("❌ Erreur parsing:", parseError.message);
      }
    });
  });

  req.on("error", (error) => {
    console.error("❌ Erreur requête:", error.message);
  });

  req.end();
}

testAPI();
