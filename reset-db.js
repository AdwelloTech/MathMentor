// MongoDB reset script for production database
db.getCollectionNames().forEach(function(c) {
  try {
    db.getCollection(c).drop();
    print('✅ Dropped collection:', c);
  } catch (error) {
    print('⚠️  Collection', c, 'might not exist or already dropped');
  }
});
print('🎉 Database reset complete!');
