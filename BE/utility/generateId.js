const generateId = (prefix = "ID") => {
  const timestamp = Date.now().toString();
  const randomSuffix = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");

  const id = `${prefix}-${timestamp}-${randomSuffix}`;

  return id.length > 22 ? id.slice(0, 22) : id;
};

module.exports = {
  generateId,
};
