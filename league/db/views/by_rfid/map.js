function(doc) {
  if(doc.type === "player")
    emit(doc.rfid, {
	"id": doc._id,
	"name": doc.name,
	"rfid": doc.rfid,
	});
}
