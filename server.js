import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pokemon from "pokemon";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  res.locals.nav = [
    { href: "/", label: "Home" },
    { href: "/names", label: "Names" },
    { href: "/locations", label: "Locations" }
  ];
  res.locals.pkgName = "pokemon";
  res.locals.apiName = "PokeAPI";
  res.locals.request = req;
  next();
});

async function callPoke(pathname) {
  const url = new URL(`https://pokeapi.co/api/v2/${pathname}`);
  const res = await fetch(url.toString(), { headers: { "User-Agent": "csumb-hw3-app" } });
  if (!res.ok) throw new Error(`PokeAPI error: ${res.status} ${res.statusText}`);
  return res.json();
}

// Home
app.get("/", (req, res) => {
  res.render("home", { title: "Pokémon With Farker! • Home" });
});

// Names page
app.get("/names", (req, res) => {
  const limit = Math.max(1, Math.min(200, Number(req.query.limit) || 20));
  const startsWith = (req.query.startsWith || "").trim();
  const all = pokemon.all();
  let names = startsWith ? all.filter(n => n.toLowerCase().startsWith(startsWith.toLowerCase())) : all;
  names = names.slice(0, limit);
  res.render("names", { title: "Pokémon Names", limit, startsWith, names });
});

// Locations page 
app.get("/locations", async (req, res) => {
  try {
    const regions = await callPoke("region");
    const selected = (req.query.region || "").trim();
    let regionData = null;
    if (selected) {
      regionData = await callPoke(`region/${selected}`);
    }
    res.render("locations", {
      title: "Pokémon Locations",
      regions: regions.results || [],
      selected,
      regionData
    });
  } catch (e) {
    res.status(500).render("error", { title: "Error", message: e.message });
  }
});

// 404
app.use((req, res) => {
  res.status(404).render("error", { title: "Not found", message: "Page not found" });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
