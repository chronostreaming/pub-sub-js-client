export class EventPublishRequest {
  constructor(data) {
    this.data = data;
  }
}

export class EventResponse {
  constructor(id, data, createdAt) {
    this.id = id;
    this.data = data;
    this.createdAt = new Date(createdAt);
  }
}

export class Subscription {
  constructor(id, name, topicId) {
    this.id = id;
    this.name = name;
    this.topicId = topicId;
  }
}

export class Topic {
  constructor(id, name, organizationId) {
    this.id = id;
    this.name = name;
    this.organizationId = organizationId;
  }
}
