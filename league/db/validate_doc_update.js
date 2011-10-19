function(newDoc, oldDoc, userCtx) {
  log("OLD: " + JSON.stringify(newDoc))
  log("NEW: " + JSON.stringify(oldDoc))
  if (!~userCtx.roles.indexOf("_admin")) {
    throw({unauthorized: "You are not authorized to modify this document"});
  }
}

