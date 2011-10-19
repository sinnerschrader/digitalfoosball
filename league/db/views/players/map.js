function(doc) {
  if (doc.type === "player") {
    emit(doc._id, doc);
  }
};

