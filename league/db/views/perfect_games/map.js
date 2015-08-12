function(doc) {
  if(doc.type === "game" && doc.players.home.length && doc.players.visitors.length) {
    var score = doc.goals.reduce(function(prev, curr) {prev[curr.scorer]+=curr.value; return prev; }, {home: 0, visitors: 0});
    if(score.home <= 0 || score.visitors <= 0) {
      emit(null, {"score": score, "players": doc.players});
    }
  }
}
