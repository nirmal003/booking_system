class ApiFeatures {
  constructor(query, queryStr) {
    this.query = query;
    this.queryStr = queryStr;
  }

  search() {
    const keyword = this.queryStr.search
      ? {
          name: {
            $regex: this.queryStr.search,
            $options: "i",
          },
        }
      : {};

    this.query = this.query.find({ ...keyword });

    return this;
  }

  filter() {
    const queryCopy = { ...this.queryStr };

    // Removing some field for Category
    const removeFeild = ["keyword", "page", "limit"];
    removeFeild.forEach((key) => delete queryCopy[key]);

    // Filter for Price and Rating
    const modifiedPrice = {};
    for (const key in queryCopy.price)
      modifiedPrice[`$${key}`] = queryCopy.price[key];

    const modifiedQuery = { ...queryCopy, price: modifiedPrice };

    // const queryStr = JSON.stringify(queryCopy);
    // queryStr.replace(/\b(gt|gte|lt|lte)\b/g, (key) => `$${key}`);
    // this.query = this.query.find(JSON.parse(queryStr));

    this.query =
      JSON.stringify(modifiedQuery.price) === `{}`
        ? this.query.find(queryCopy)
        : this.query.find(modifiedQuery);

    return this;
  }

  pagination(resultPerPage) {
    const currentPage = Number(this.queryStr.page) || 1;

    const skip = resultPerPage * (currentPage - 1);

    this.query = this.query.limit(resultPerPage).skip(skip);

    return this;
  }
}

module.exports = ApiFeatures;
