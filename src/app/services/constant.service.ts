import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ConstantService {

  CATEGORY = {
    GET_ALL: {
      embed: "([id,name,priority,status,rateLimit,updatedAt])"
    },
    GET_ALL_NAME: {
      embed: "([id,name])",
      params: { limit: 500, status: 'ACTIVE' },
    }
  };

  TEMPLATE = {
    GET_ALL: {
      embed: "([id,name,status,channels,updatedAt],category[name],attachments)"
    }
  };

  USERSEGMENT = {
    GET_ALL: {
      embed: "([id,name,status,description,createdAt,updatedAt])"
    }
  };

  NOTIFICATION = {
    GET_ALL: {
      embed: "([id,channels,errorCode,isScheduled,isProcessed,isBulkNotification,createdAt,processedAt,updatedAt,scheduledAt,status],category[name])"
    }
  };

  ABTESTING = {
    GET_ALL: {
      embed: "([id,channels,errorCode,isBulkNotification,isScheduled,isProcessed,status,createdAt,updatedAt,scheduledAt,variantSettings],category[name])"
    }
  };

  USERPROFILE = {
    GET_ALL: {
      embed: "([id,name,gender,dateOfBirth,language,role,createdAt,updatedAt])"
    }
  };

  QUEUE_NOTIFICATION = {
    GET_ALL: {
      embed: "([id,customerId,notificationId,categoryName,channel,identifier,priority,status,createdAt,isAbTesting])"
    }
  };

  ERROR_NOTIFICATION = {
    GET_ALL: {
      embed: "([id,customerId,channel,notificationId,isScheduled,priority,categoryName,errorCode,retryCount,retryStatus,lastRetryAt,createdAt,userId,isAbTesting])"
    }
  };

  NOTIFICATION_HISTORY = {
    GET_ALL_ERROR_DETAIL: {
      embed: "([id,customerId,categoryName,channel,identifier,priority,errorCode,retryCount,retryStatus,lastRetryAt,createdAt])"
    },
    GET_ALL_QUEUED_DETAIL: {
      embed: "([id,customerId,categoryName,channel,identifier,priority,status])"
    },
    GET_ALL_DIFFERED_DETAIL: {
      embed: "([id,customerId,categoryName,channel,identifier,priority,status,deferredReason,scheduledAt])"
    },
    GET_ALL_DELIVERED_NOTIFICATION: {
      embed: "([id,customerId,categoryName,channel,identifier,priority,status,sentAt])"
    }
  };

  USER_BASE_NOTIFICATOIN_HISTORY = {
    GET_ALL_ERROR_DETAIL: {
      embed: "([id,notificationId,categoryName,channel,identifier,priority,errorCode,retryCount,retryStatus,lastRetryAt,createdAt])"
    },
    GET_ALL_QUEUED_DETAIL: {
      embed: "([id,notificationId,categoryName,channel,identifier,priority,deferredReason,status,scheduledAt,isAbTesting])"
    },
    GET_ALL_DIFFERED_DETAIL: {
      embed: "([id,notificationId,categoryName,channel,identifier,priority,deferredReason,status,scheduledAt,isAbTesting])"
    },
    GET_ALL_DELIVERED_NOTIFICATION: {
      embed: "([id,notificationId,categoryName,channel,identifier,priority,status,createdAt,isAbTesting])"
    }
  };

  VIEW_ATTRIBUTE = {
    GET_ALL_ATTRIBUTE: {
      embed: "([id,name,type,description,createdAt,updatedAt])"
    }
  }

  constructor() { }

}
