function(doc, req) {
  return doc.type === "game" && doc.players.home.length && doc.players.visitors.length && doc.ranked;
};

