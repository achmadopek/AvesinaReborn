class PractitionerService {

  constructor(client) {
    this.client = client;
  }

  async exists(practitionerId) {

    if (!practitionerId) {
      return false;
    }

    try {

      await this.client.get(
        `/Practitioner/${practitionerId}`
      );

      return true;

    } catch (err) {

      if (err?.status === 404) {
        return false;
      }

      throw err;
    }
  }
}

module.exports = PractitionerService;