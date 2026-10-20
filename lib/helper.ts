import moment from "moment";

export const convertTimeToAMPM = (time24: string) => {
    // Parse the input time using moment
    const parsedTime = moment(time24, 'HH:mm:ss');

    // Format the time in AM/PM format
    const time12 = parsedTime.format('h:mm A');

    return time12;
};

export const convertDate = (date: string | moment.Moment, formate: string) => {
    // Parse the input time using moment
    const dateFormat = moment(date).format(formate);
    return dateFormat;
};

// Base URL of uploaded files (legacy: REACT_APP_MEDIA_API_URL). Same-origin by default.
const mediaBase = (process.env.NEXT_PUBLIC_MEDIA_API_URL || '/api/storage').replace(/\/+$/, '')
export const mediaUrl = mediaBase + '/profile/'
export const mediaUrlBioFile = mediaBase + '/bioFile/'


export const replaceLogo = (e: any) => {
    e.target.src = '/assets/images/placeholder.jpg'
}

export const getFileIcon = (fileExtension: string) => {
    if (fileExtension) {
        const extension: any = fileExtension.split(".").pop();
        switch (extension.toLowerCase()) {
            case "pdf": {
                return "/assets/images/pdf.png";
            }
            case "jpeg":
            case "png":
            case "jpg": {
                return "/assets/images/jpg.png";
            }
            case "doc": {
                return "/assets/images/docs.png";
            }
            default: {
                return "/assets/images/docs.png";
            }
        }
    }
    return "";
};